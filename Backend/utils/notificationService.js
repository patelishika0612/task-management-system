import { promiseDb } from "../db.js";
import { sendPushToUser } from "./pushNotification.js";

export const createNotification = async ({
    recipientId,
    recipientType = "employee",
    title,
    message,
    type,
    referenceId = null,
    referenceType = null,
    url = "/employeedashboard",
    eventKey = null,
}) => {
    try {
        const [result] = await promiseDb.query(
            `INSERT IGNORE INTO notifications
            (
                recipient_id,
                recipient_type,
                title,
                message,
                notification_type,
                reference_id,
                reference_type,
                notification_url,
                event_key
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                recipientId,
                recipientType,
                title,
                message,
                type,
                referenceId,
                referenceType,
                url,
                eventKey,
            ]
        );

        // Duplicate event હોય તો ફરી notification નહીં મોકલાય.
        if (result.affectedRows === 0) {
            return { success: true, duplicate: true };
        }

        try {
           const pushResult = await sendPushToUser(
    recipientId,
    recipientType,
    {
        title,
        body: message,
        url,
        tag: eventKey || `${type}-${referenceId || Date.now()}`,
    }
);

console.log("Chat push result:", {
    recipientId,
    recipientType,
    ...pushResult,
});
        } catch (pushError) {
            console.error("Browser push failed:", pushError.message);
        }

        return { success: true };
    } catch (error) {
        console.error("Create notification error:", error);
        return { success: false };
    }
};