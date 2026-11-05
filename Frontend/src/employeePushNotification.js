import EmployeeAPI from "./employeeAPI";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(rawData, (char) =>
    char.charCodeAt(0)
  );
};

export const enableEmployeePushNotifications = async () => {
  try {
    console.log("STEP 1: Checking browser support");

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error("Browser does not support push notifications.");
    }

    if (!("Notification" in window)) {
      throw new Error("Notifications are not supported.");
    }

    console.log("STEP 2: Notification permission");

    if (Notification.permission === "denied") {
      throw new Error(
        "Notifications are blocked. Enable them in browser settings."
      );
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error("Notification permission not granted.");
    }

    console.log("STEP 3: Registering service worker");

    const registration =
      await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;

    console.log("Service Worker:", registration);

    console.log("STEP 4: Getting VAPID public key");

    const keyResponse = await EmployeeAPI.get("/push/public-key");

    const publicKey = keyResponse.data.publicKey;

    if (!publicKey) {
      throw new Error("VAPID public key not received.");
    }

    console.log("Public Key received");

    console.log("STEP 5: Creating subscription");

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey),
      });
    }

    console.log("Browser Subscription:", subscription.toJSON());

    console.log("STEP 6: Saving subscription to backend");

    const response = await EmployeeAPI.post(
      "/push/subscribe",
      subscription.toJSON()
    );

    console.log("Backend Subscription Response:", response.data);

    return {
      success: true,
      message: "Push notifications enabled successfully.",
    };

  } catch (error) {
    console.error("PUSH NOTIFICATION ERROR:", error);

    console.error(
      "API ERROR RESPONSE:",
      error.response?.data
    );

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to enable notifications.",
    };
  }
};

export const subscribeEmployeePushNotifications = async () => {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error("Browser does not support push notifications.");
    }

    if (!("Notification" in window) ||
        Notification.permission !== "granted") {
      return {
        success: false,
        message: "Notification permission not granted.",
      };
    }

    const registration =
      await navigator.serviceWorker.register("/sw.js");

    await navigator.serviceWorker.ready;

    const keyResponse = await EmployeeAPI.get("/push/public-key");
    const publicKey = keyResponse.data.publicKey;

    if (!publicKey) {
      throw new Error("VAPID public key not received.");
    }

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey),
      });
    }

    await EmployeeAPI.post(
      "/push/subscribe",
      subscription.toJSON()
    );

    return {
      success: true,
      message: "Push notifications enabled successfully.",
    };
  } catch (error) {
    console.error("PUSH SUBSCRIPTION ERROR:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to enable notifications.",
    };
  }
};
export const disableEmployeePushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");

    if (!registration) {
      return { success: true };
    }

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true };
    }

    // Delete subscription from backend first
    await EmployeeAPI.post(
      "/push/unsubscribe",
      { endpoint: subscription.endpoint }
    );

    // Then unsubscribe browser
    await subscription.unsubscribe();

    console.log("Employee push notifications disabled.");

    return { success: true };

  } catch (error) {
    console.error("PUSH UNSUBSCRIBE ERROR:", error);

    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Unable to disable notifications.",
    };
  }
};

