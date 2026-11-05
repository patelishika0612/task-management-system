
import API from "./api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

export const subscribeAdminPushNotifications = async () => {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      throw new Error("Browser does not support push notifications.");
    }

    if (Notification.permission !== "granted") {
      throw new Error("Notification permission is not granted.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;

    const keyResponse = await API.get("/push/public-key");
    const publicKey = keyResponse.data?.publicKey;

    if (!publicKey) {
      throw new Error("VAPID public key not received.");
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const response = await API.post(
      "/push/admin/subscribe",
      subscription.toJSON()
    );

    return {
      success: true,
      message: response.data?.message || "Admin notifications enabled.",
    };
  } catch (error) {
    console.error("ADMIN PUSH SUBSCRIBE ERROR:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to enable admin notifications.",
    };
  }
};

export const unsubscribeAdminPushNotifications = async () => {
  try {
    if (!("serviceWorker" in navigator)) {
      return { success: true };
    }

    const registration = await navigator.serviceWorker.getRegistration("/");

    if (!registration) {
      return { success: true };
    }

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true };
    }

    // Remove the server mapping before removing the browser subscription.
    await API.post("/push/admin/unsubscribe", {
      endpoint: subscription.endpoint,
    });

    await subscription.unsubscribe();

    return { success: true };
  } catch (error) {
    console.error("ADMIN PUSH UNSUBSCRIBE ERROR:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to unsubscribe admin notifications.",
    };
  }
};
