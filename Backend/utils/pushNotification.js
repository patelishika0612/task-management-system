import webpush from "web-push";
import crypto from "crypto";
import { promiseDb } from "../db.js";

let vapidConfigured = false;

const configureVapid = () => {
  if (vapidConfigured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID configuration is missing in .env");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
};

export const getVapidPublicKey = () => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    throw new Error("VAPID_PUBLIC_KEY is missing in .env");
  }

  return process.env.VAPID_PUBLIC_KEY;
};

export const sendPushToUser = async (
  userId,
  userType,
  notification
) => {
  configureVapid();

  const [subscriptions] = await promiseDb.query(
    `SELECT id, endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE user_id = ? AND user_type = ?`,
    [userId, userType]
  );

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notification)
        );
      } catch (error) {
        // 404 / 410 means browser subscription has expired.
        if (error.statusCode === 404 || error.statusCode === 410) {
          await promiseDb.query(
            "DELETE FROM push_subscriptions WHERE id = ?",
            [sub.id]
          );
          return;
        }

        throw error;
      }
    })
  );

  return {
    total: subscriptions.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
};

export const sendPushToAllEmployees = async (notification) => {
  configureVapid();

  const [subscriptions] = await promiseDb.query(
    `SELECT id, endpoint, p256dh, auth
     FROM push_subscriptions
     WHERE user_type = 'employee'`
  );

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(notification)
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await promiseDb.query(
            "DELETE FROM push_subscriptions WHERE id = ?",
            [sub.id]
          );
          return;
        }

        throw error;
      }
    })
  );

  return {
    total: subscriptions.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
};