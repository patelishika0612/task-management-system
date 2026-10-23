
import express from "express";
import connection from "../db.js";

const router = express.Router();
const db = connection.promise();

// =====================================================
// HELPER
// =====================================================

const isValidId = (id) =>
    Number.isInteger(Number(id)) && Number(id) > 0;

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

        const savedMessage = rows[0];
        const io = req.app.get("io");

        if (io) {
            io.to(`conversation:${conversationId}`).emit(
                "chat:message",
                savedMessage
            );
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
