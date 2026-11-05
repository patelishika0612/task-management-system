import crypto from "crypto";
import { promiseDb } from "../db.js";
import {
  getVapidPublicKey,
} from "../utils/pushNotification.js";

// Get public VAPID key
export const getPublicKey = (req, res) => {
  try {
    return res.json({
      success: true,
      publicKey: getVapidPublicKey(),
    });
  } catch (error) {
    console.error("VAPID KEY ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Push notification configuration error.",
    });
  }
};

// Save employee browser subscription
export const subscribeEmployee = async (req, res) => {
  try {
    const subscription = req.body;

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription.",
      });
    }

    const endpointHash = crypto
      .createHash("sha256")
      .update(subscription.endpoint)
      .digest("hex");

    await promiseDb.query(
      `INSERT INTO push_subscriptions
       (user_id, user_type, endpoint, endpoint_hash, p256dh, auth)
       VALUES (?, 'employee', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       user_type = 'employee',
       endpoint = VALUES(endpoint),
       p256dh = VALUES(p256dh),
       auth = VALUES(auth)`,
      [
        req.employee.emp_id,
        subscription.endpoint,
        endpointHash,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Push notification subscription saved.",
    });
  } catch (error) {
    console.error("PUSH SUBSCRIBE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save push subscription.",
    });
  }
};

// Remove employee browser subscription
export const unsubscribeEmployee = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Subscription endpoint is required.",
      });
    }

    const endpointHash = crypto
      .createHash("sha256")
      .update(endpoint)
      .digest("hex");

    await promiseDb.query(
      `DELETE FROM push_subscriptions
       WHERE endpoint_hash = ?
       AND user_id = ?
       AND user_type = 'employee'`,
      [endpointHash, req.employee.emp_id]
    );

    return res.json({
      success: true,
      message: "Push subscription removed.",
    });
  } catch (error) {
    console.error("PUSH UNSUBSCRIBE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to unsubscribe.",
    });
  }
};




// Save admin browser subscription
export const subscribeAdmin = async (req, res) => {
  try {
    const subscription = req.body;

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription.",
      });
    }

    const endpointHash = crypto
      .createHash("sha256")
      .update(subscription.endpoint)
      .digest("hex");

    await promiseDb.query(
      `INSERT INTO push_subscriptions
       (user_id, user_type, endpoint, endpoint_hash, p256dh, auth)
       VALUES (?, 'admin', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       user_type = 'admin',
       endpoint = VALUES(endpoint),
       p256dh = VALUES(p256dh),
       auth = VALUES(auth)`,
      [
        req.admin.id,
        subscription.endpoint,
        endpointHash,
        subscription.keys.p256dh,
        subscription.keys.auth,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Admin push subscription saved.",
    });
  } catch (error) {
    console.error("ADMIN PUSH SUBSCRIBE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save admin push subscription.",
    });
  }
};

// Remove admin browser subscription
export const unsubscribeAdmin = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Subscription endpoint is required.",
      });
    }

    const endpointHash = crypto
      .createHash("sha256")
      .update(endpoint)
      .digest("hex");

    await promiseDb.query(
      `DELETE FROM push_subscriptions
       WHERE endpoint_hash = ?
       AND user_id = ?
       AND user_type = 'admin'`,
      [endpointHash, req.admin.id]
    );

    return res.json({
      success: true,
      message: "Admin push subscription removed.",
    });
  } catch (error) {
    console.error("ADMIN PUSH UNSUBSCRIBE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to unsubscribe admin.",
    });
  }
};
