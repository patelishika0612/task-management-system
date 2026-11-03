import connection from "../db.js";

const db = connection.promise();

// admin_login.id and employe.emp_id both start at 1, but chat tables keep a
// single user_id column. Admins are stored as offset + admin id so the two
// never collide. Keep in sync with ADMIN_CHAT_ID_OFFSET in chatNotifications.js.
export const ADMIN_CHAT_ID_OFFSET = 1000000000;

// An admin whose email also belongs to an employee is the same person, so
// they chat as that employee (one contact, one conversation history) no
// matter which panel they log in from.
// Returns Map(adminChatId -> emp_id).
export const getLinkedAdmins = async () => {
    const [rows] = await db.query(
        `SELECT a.id AS admin_id, MIN(e.emp_id) AS emp_id
         FROM admin_login a
         INNER JOIN employe e
           ON LOWER(TRIM(e.email)) = LOWER(TRIM(a.email))
         GROUP BY a.id`
    );

    return new Map(
        rows.map((row) => [
            ADMIN_CHAT_ID_OFFSET + Number(row.admin_id),
            Number(row.emp_id),
        ])
    );
};

export const getAdminChatUserId = async (adminId) => {
    const adminChatId = ADMIN_CHAT_ID_OFFSET + Number(adminId);
    const linked = await getLinkedAdmins();

    return linked.get(adminChatId) ?? adminChatId;
};

// Maps a stale admin chat id (from a session started before the link
// existed) to the linked employee id. Other ids pass through unchanged.
export const resolveChatUserIds = async (ids) => {
    const numbers = ids.map(Number);

   if (!numbers.some((id) => id >= ADMIN_CHAT_ID_OFFSET)) {
    return numbers;
}

    const linked = await getLinkedAdmins();

    return numbers.map((id) => linked.get(id) ?? id);
};

export const resolveChatUserId = async (id) =>
    (await resolveChatUserIds([id]))[0];

// Moves everything an admin did under their admin chat id onto their linked
// employee id. Direct chats both identities had with the same person are
// merged into one conversation. Safe to run repeatedly.
const mergeAdminIntoEmployee = async (adminChatId, empId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [adminConversations] = await conn.query(
            `SELECT
                c.id,
                c.type,
                mine.last_read_message_id AS lastRead,
                (
                    SELECT other.user_id
                    FROM chat_conversation_members other
                    WHERE other.conversation_id = c.id
                      AND other.user_id <> mine.user_id
                    LIMIT 1
                ) AS otherUserId
             FROM chat_conversation_members mine
             INNER JOIN chat_conversations c
               ON c.id = mine.conversation_id
             WHERE mine.user_id = ?`,
            [adminChatId]
        );

        for (const conversation of adminConversations) {
            const otherUserId = Number(conversation.otherUserId);

            let targetId = null;

            if (conversation.type === "direct" && otherUserId !== empId) {
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
                       AND c.id <> ?
                     LIMIT 1`,
                    [empId, otherUserId, conversation.id]
                );

                targetId = existing[0]?.id ?? null;
            }

            if (targetId) {
                // Same pair already has a conversation: fold this one into it.
                await conn.query(
                    `UPDATE chat_messages
                     SET conversation_id = ?
                     WHERE conversation_id = ?`,
                    [targetId, conversation.id]
                );

                await conn.query(
                    `UPDATE chat_conversation_members target
                     INNER JOIN chat_conversation_members source
                       ON source.conversation_id = ?
                      AND source.user_id = target.user_id
                     SET target.last_read_message_id = GREATEST(
                         COALESCE(target.last_read_message_id, 0),
                         COALESCE(source.last_read_message_id, 0)
                     )
                     WHERE target.conversation_id = ?`,
                    [conversation.id, targetId]
                );

                await conn.query(
                    `UPDATE chat_conversation_members
                     SET last_read_message_id = GREATEST(
                         COALESCE(last_read_message_id, 0), ?
                     )
                     WHERE conversation_id = ?
                       AND user_id = ?`,
                    [Number(conversation.lastRead) || 0, targetId, empId]
                );

                await conn.query(
                    `DELETE FROM chat_conversation_members
                     WHERE conversation_id = ?`,
                    [conversation.id]
                );

                await conn.query(
                    `DELETE FROM chat_conversations WHERE id = ?`,
                    [conversation.id]
                );

                continue;
            }

            const [alreadyMember] = await conn.query(
                `SELECT id
                 FROM chat_conversation_members
                 WHERE conversation_id = ?
                   AND user_id = ?`,
                [conversation.id, empId]
            );

            if (alreadyMember.length > 0) {
                // Group (or a chat with themselves) that has both identities.
                await conn.query(
                    `DELETE FROM chat_conversation_members
                     WHERE conversation_id = ?
                       AND user_id = ?`,
                    [conversation.id, adminChatId]
                );
            } else {
                await conn.query(
                    `UPDATE chat_conversation_members
                     SET user_id = ?
                     WHERE conversation_id = ?
                       AND user_id = ?`,
                    [empId, conversation.id, adminChatId]
                );
            }
        }

        await conn.query(
            `UPDATE chat_messages SET sender_id = ? WHERE sender_id = ?`,
            [empId, adminChatId]
        );

        await conn.query(
            `UPDATE chat_conversations SET created_by = ? WHERE created_by = ?`,
            [empId, adminChatId]
        );

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

export const mergeLinkedAdminChats = async () => {
    const linked = await getLinkedAdmins();

    for (const [adminChatId, empId] of linked) {
        await mergeAdminIntoEmployee(adminChatId, empId);
    }
};
