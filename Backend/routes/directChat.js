
import express from "express";
import connection from "../db.js";

const router = express.Router();
const db = connection.promise();

// =====================================================
// HELPER
// =====================================================

const isValidId = (id) =>
    Number.isInteger(Number(id)) && Number(id) > 0;

// admin_login.id and employe.emp_id both start at 1, but chat tables keep a
// single user_id column. Admins are stored as offset + admin id so the two
// never collide. Keep in sync with ADMIN_CHAT_ID_OFFSET in ChatPage.jsx.
const ADMIN_CHAT_ID_OFFSET = 1000000000;

// Unread counts live on the server so messages sent while the receiver is
// offline still show up in their sidebar. Each member remembers the last
// message id they have seen; anything newer from someone else is unread.
const ensureReadTracking = async () => {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'chat_conversation_members'
           AND COLUMN_NAME = 'last_read_message_id'`
    );

    if (columns.length > 0) return;

    await db.query(
        `ALTER TABLE chat_conversation_members
         ADD COLUMN last_read_message_id INT NULL DEFAULT NULL`
    );

    // Existing history counts as read so nobody gets a flood of old badges.
    await db.query(
        `UPDATE chat_conversation_members m
         SET m.last_read_message_id = (
             SELECT MAX(msg.id)
             FROM chat_messages msg
             WHERE msg.conversation_id = m.conversation_id
         )`
    );
};

const readTrackingReady = ensureReadTracking().catch((error) => {
    console.error("Chat read tracking setup error:", error);
});

const markConversationRead = async (conversationId, userId) => {
    await readTrackingReady;

    await db.query(
        `UPDATE chat_conversation_members
         SET last_read_message_id = GREATEST(
             COALESCE(last_read_message_id, 0),
             COALESCE((
                 SELECT MAX(id) FROM chat_messages WHERE conversation_id = ?
             ), 0)
         )
         WHERE conversation_id = ?
           AND user_id = ?`,
        [conversationId, conversationId, userId]
    );
};

// =====================================================
// CHAT CONTACTS (employees + admins)
// GET /api/chat/contacts
// =====================================================

router.get("/contacts", async (req, res) => {
    try {
        const [employees] = await db.query(
            `SELECT
                e.emp_id AS user_id,
                e.emp_name AS name,
                e.email,
                e.image,
                d.department_name
             FROM employe e
             LEFT JOIN departments d
               ON e.department_id = d.department_id
             ORDER BY e.emp_name ASC`
        );

        const [admins] = await db.query(
            `SELECT id, email
             FROM admin_login
             ORDER BY id ASC`
        );

        const adminContacts = admins.map((admin) => ({
            user_id: ADMIN_CHAT_ID_OFFSET + Number(admin.id),
            name: "Admin",
            email: admin.email,
            image: null,
            role: admin.email,
            isAdmin: true,
        }));

        return res.json({
            success: true,
            data: [...adminContacts, ...employees],
        });
    } catch (error) {
        console.error("Get chat contacts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch chat contacts",
        });
    }
});

// =====================================================
// CREATE OR GET DIRECT CONVERSATION
// POST /api/chat/direct
// body: { userId, currentUserId }
// =====================================================

router.post("/direct", async (req, res) => {
    let conn;

    try {
        const senderId = Number(req.body.currentUserId);
        const receiverId = Number(req.body.userId);

        if (
            !isValidId(senderId) ||
            !isValidId(receiverId) ||
            senderId === receiverId
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid, different user IDs are required",
            });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        const [existing] = await conn.query(
            `SELECT c.id
             FROM chat_conversations c
             JOIN chat_conversation_members m1
               ON m1.conversation_id = c.id
              AND m1.user_id = ?
             JOIN chat_conversation_members m2
               ON m2.conversation_id = c.id
              AND m2.user_id = ?
             WHERE c.type = 'direct'
             LIMIT 1`,
            [senderId, receiverId]
        );

        if (existing.length > 0) {
            await conn.commit();

            return res.json({
                success: true,
                conversationId: existing[0].id,
                message: "Conversation found",
            });
        }

        const [conversation] = await conn.query(
            `INSERT INTO chat_conversations (type, created_by)
             VALUES ('direct', ?)`,
            [senderId]
        );

        const conversationId = conversation.insertId;

        await conn.query(
            `INSERT INTO chat_conversation_members
             (conversation_id, user_id)
             VALUES (?, ?), (?, ?)`,
            [
                conversationId,
                senderId,
                conversationId,
                receiverId,
            ]
        );

        await conn.commit();

        return res.status(201).json({
            success: true,
            conversationId,
            message: "Conversation created",
        });
    } catch (error) {
        if (conn) await conn.rollback();

        console.error("Create direct conversation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create direct conversation",
        });
    } finally {
        if (conn) conn.release();
    }
});

// =====================================================
// CREATE GROUP
// POST /api/chat/group
// body: { name, currentUserId, memberIds: [] }
// Creator is automatically added as a member.
// =====================================================

router.post("/group", async (req, res) => {
    let conn;

    try {
        const name = String(req.body.name || "").trim();
        const currentUserId = Number(req.body.currentUserId);

        const requestedMembers = Array.isArray(req.body.memberIds)
            ? req.body.memberIds.map(Number)
            : [];

        if (
            !name ||
            name.length > 150 ||
            !isValidId(currentUserId) ||
            requestedMembers.some((id) => !isValidId(id))
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid group name, creator and member IDs are required",
            });
        }

        const memberIds = [
            ...new Set([currentUserId, ...requestedMembers]),
        ];

        // Creator plus at least two other members.
        if (memberIds.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Select at least two other members",
            });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        const [conversation] = await conn.query(
            `INSERT INTO chat_conversations
             (type, name, created_by)
             VALUES ('group', ?, ?)`,
            [name, currentUserId]
        );

        const conversationId = conversation.insertId;

        const placeholders = memberIds.map(() => "(?, ?)").join(", ");

        const values = memberIds.flatMap((userId) => [
            conversationId,
            userId,
        ]);

        await conn.query(
            `INSERT INTO chat_conversation_members
             (conversation_id, user_id)
             VALUES ${placeholders}`,
            values
        );

        await conn.commit();

        return res.status(201).json({
            success: true,
            conversationId,
            name,
            memberIds,
            message: "Group created successfully",
        });
    } catch (error) {
        if (conn) await conn.rollback();

        console.error("Create group error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create group. Check the database schema and conversation type.",
        });
    } finally {
        if (conn) conn.release();
    }
});

// =====================================================
// GET GROUPS FOR A USER
// GET /api/chat/groups?userId=27
// =====================================================

router.get("/groups", async (req, res) => {
    try {
        const userId = Number(req.query.userId);

        if (!isValidId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required",
            });
        }

        const [groups] = await db.query(
            `SELECT
                c.id AS conversationId,
                c.name,
                c.created_by,
                c.created_at,
                COUNT(DISTINCT m.user_id) AS memberCount
             FROM chat_conversations c
             INNER JOIN chat_conversation_members mine
               ON mine.conversation_id = c.id
              AND mine.user_id = ?
             INNER JOIN chat_conversation_members m
               ON m.conversation_id = c.id
             WHERE c.type = 'group'
             GROUP BY c.id, c.name, c.created_by, c.created_at
             ORDER BY c.id DESC`,
            [userId]
        );

        return res.json({
            success: true,
            data: groups,
        });
    } catch (error) {
        console.error("Get groups error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch groups",
        });
    }
});

// =====================================================
// UNREAD COUNTS
// GET /api/chat/unread?userId=27
// Returns { "direct-<otherUserId>": n, "group-<conversationId>": n }
// =====================================================

router.get("/unread", async (req, res) => {
    try {
        const userId = Number(req.query.userId);

        if (!isValidId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required",
            });
        }

        await readTrackingReady;

        const [rows] = await db.query(
            `SELECT
                c.id AS conversationId,
                c.type,
                (
                    SELECT other.user_id
                    FROM chat_conversation_members other
                    WHERE other.conversation_id = c.id
                      AND other.user_id <> mine.user_id
                    LIMIT 1
                ) AS otherUserId,
                COUNT(msg.id) AS unread
             FROM chat_conversation_members mine
             INNER JOIN chat_conversations c
               ON c.id = mine.conversation_id
             INNER JOIN chat_messages msg
               ON msg.conversation_id = c.id
              AND msg.id > COALESCE(mine.last_read_message_id, 0)
              AND msg.sender_id <> mine.user_id
              AND msg.deleted_at IS NULL
             WHERE mine.user_id = ?
             GROUP BY c.id, c.type, mine.user_id`,
            [userId]
        );

        // Direct chats with deleted employees/admins never show up in the
        // contact list, so their messages must not count towards the badge.
        const [employees] = await db.query(`SELECT emp_id FROM employe`);
        const [admins] = await db.query(`SELECT id FROM admin_login`);

        const existingUserIds = new Set([
            ...employees.map((row) => Number(row.emp_id)),
            ...admins.map((row) => ADMIN_CHAT_ID_OFFSET + Number(row.id)),
        ]);

        const counts = {};

        rows.forEach((row) => {
            if (
                row.type !== "group" &&
                !existingUserIds.has(Number(row.otherUserId))
            ) {
                return;
            }

            const key =
                row.type === "group"
                    ? `group-${row.conversationId}`
                    : `direct-${row.otherUserId}`;

            counts[key] = Number(row.unread) || 0;
        });

        return res.json({
            success: true,
            data: counts,
        });
    } catch (error) {
        console.error("Get unread counts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread counts",
        });
    }
});

// =====================================================
// MARK CONVERSATION READ
// POST /api/chat/:conversationId/read
// body: { userId }
// =====================================================

router.post("/:conversationId/read", async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const userId = Number(req.body?.userId);

        if (!isValidId(conversationId) || !isValidId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid conversationId and userId are required",
            });
        }

        await markConversationRead(conversationId, userId);

        return res.json({ success: true });
    } catch (error) {
        console.error("Mark chat read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark conversation read",
        });
    }
});

// =====================================================
// GET CONVERSATION MESSAGES
// GET /api/chat/:conversationId/messages?userId=27
// Works for direct and group conversations.
// =====================================================

router.get("/:conversationId/messages", async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const userId = Number(req.query.userId);

        if (!isValidId(conversationId) || !isValidId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid conversationId and userId are required",
            });
        }

        const [members] = await db.query(
            `SELECT id
             FROM chat_conversation_members
             WHERE conversation_id = ?
               AND user_id = ?
             LIMIT 1`,
            [conversationId, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this conversation",
            });
        }

        const [messages] = await db.query(
            `SELECT
                id,
                conversation_id,
                sender_id,
                message_type,
                message,
                file_url,
                file_name,
                sent_at
             FROM chat_messages
             WHERE conversation_id = ?
               AND deleted_at IS NULL
             ORDER BY id ASC`,
            [conversationId]
        );

        // Opening a conversation reads it.
        await markConversationRead(conversationId, userId);

        return res.json({
            success: true,
            data: messages,
        });
    } catch (error) {
        console.error("Get chat messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
});

// =====================================================
// SEND MESSAGE
// POST /api/chat/:conversationId/messages
// body: { userId, message, messageType }
// Works for direct and group conversations.
// =====================================================

router.post("/:conversationId/messages", async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const senderId = Number(req.body.userId);

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const messageType = req.body.messageType || "text";

        if (!isValidId(conversationId) || !isValidId(senderId)) {
            return res.status(400).json({
                success: false,
                message: "Valid conversationId and userId are required",
            });
        }

        if (!["text", "image", "file"].includes(messageType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message type",
            });
        }

        if (messageType === "text" && !message) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            });
        }

        // Confirm that the sender belongs to this conversation.
        const [members] = await db.query(
            `SELECT id
             FROM chat_conversation_members
             WHERE conversation_id = ?
               AND user_id = ?
             LIMIT 1`,
            [conversationId, senderId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this conversation",
            });
        }

        const [result] = await db.query(
            `INSERT INTO chat_messages
             (conversation_id, sender_id, message_type, message)
             VALUES (?, ?, ?, ?)`,
            [
                conversationId,
                senderId,
                messageType,
                message || null,
            ]
        );

        const [rows] = await db.query(
            `SELECT
                id,
                conversation_id,
                sender_id,
                message_type,
                message,
                file_url,
                file_name,
                sent_at
             FROM chat_messages
             WHERE id = ?`,
            [result.insertId]
        );

        const io = req.app.get("io");

        const [conversationMembers] = await db.query(
            `SELECT m.user_id, c.type
             FROM chat_conversation_members m
             INNER JOIN chat_conversations c
               ON c.id = m.conversation_id
             WHERE m.conversation_id = ?`,
            [conversationId]
        );

        const savedMessage = {
            ...rows[0],
            conversation_type: conversationMembers[0]?.type ?? null,
        };

        if (io) {
            // Socket.IO delivers once per socket even when it is in several
            // of these rooms. Member rooms keep every chat sidebar updated.
            io.to([
                `conversation:${conversationId}`,
                ...conversationMembers.map(
                    (member) => `chat-user:${member.user_id}`
                ),
            ]).emit("chat:message", savedMessage);
        }

        return res.status(201).json({
            success: true,
            data: savedMessage,
        });
    } catch (error) {
        console.error("Send chat message error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
});

export default router;
