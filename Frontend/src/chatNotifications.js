import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import API from "./api";

// App-wide chat notifications (WhatsApp style): one socket shared by every
// page keeps unread counts and typing indicators up to date so the sidebar
// can show them even when the chat page is not open.

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL.replace(/\/api\/?$/i, "")
).replace(/\/+$/, "");

// Admins share the chat user_id column with employees, so their chat ID is
// offset to avoid colliding with emp_id. Keep in sync with
// ADMIN_CHAT_ID_OFFSET in Backend/routes/directChat.js.
export const ADMIN_CHAT_ID_OFFSET = 1000000000;

const TYPING_EXPIRE_MS = 4000;
const UNREAD_EVENT = "chat-unread-change";
const TYPING_EVENT = "chat-typing-change";

export const getChatUserId = (role) => {
  if (role !== "admin") {
    return (
      localStorage.getItem("employeeId") ||
      localStorage.getItem("emp_id") ||
      localStorage.getItem("userId")
    );
  }

  try {
    // Prefer this tab's own login (see AdminLogin.jsx) so two admins logged
    // in from the same browser don't both chat as whoever logged in last.
    const adminId = JSON.parse(
      sessionStorage.getItem("adminData") ||
        localStorage.getItem("adminData") ||
        "null"
    )?.adminId;

    return adminId ? ADMIN_CHAT_ID_OFFSET + Number(adminId) : null;
  } catch {
    return null;
  }
};

// =====================================================
// UNREAD COUNTS (persisted, keyed like DirectChat)
// =====================================================

const unreadStorageKey = (userId) => `chatUnread:${userId}`;

export const loadUnread = (userId) => {
  if (!userId) return {};

  try {
    const counts = JSON.parse(
      localStorage.getItem(unreadStorageKey(userId)) || "{}"
    );
    return counts && typeof counts === "object" ? counts : {};
  } catch {
    return {};
  }
};

export const saveUnread = (userId, counts) => {
  if (!userId) return;

  try {
    localStorage.setItem(unreadStorageKey(userId), JSON.stringify(counts));
  } catch {
    // Storage full or blocked: counts just won't survive a reload.
  }

  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: { userId } }));
};

const totalUnread = (counts) =>
  Object.values(counts).reduce(
    (total, count) => total + (Number(count) || 0),
    0
  );

// The server is the source of truth for unread counts: it also knows about
// messages that arrived while this user was offline.
export const fetchServerUnread = async (userId) => {
  if (!userId) return null;

  try {
    const response = await API.get("/chat/unread", { params: { userId } });
    const counts = response.data?.data;

    return counts && typeof counts === "object" ? counts : null;
  } catch (error) {
    console.error("Chat unread sync error:", error);
    return null;
  }
};

// While DirectChat is mounted it counts unread messages itself (it knows
// which conversation is open), so the background listener stays out of it.
let chatViewsOpen = 0;

export const setChatViewOpen = (open) => {
  chatViewsOpen = Math.max(0, chatViewsOpen + (open ? 1 : -1));
};

// =====================================================
// SHARED SOCKET
// =====================================================

let socket = null;
let socketUserId = null;
const typingKeys = {};

const notifyTyping = () =>
  window.dispatchEvent(new CustomEvent(TYPING_EVENT));

const clearTypingKey = (key) => {
  if (!(key in typingKeys)) return;
  clearTimeout(typingKeys[key]);
  delete typingKeys[key];
  notifyTyping();
};

const ensureSocket = (userId) => {
  if (!userId) return;
  if (socket && String(socketUserId) === String(userId)) return;

  if (socket) socket.disconnect();
  Object.keys(typingKeys).forEach(clearTypingKey);

  const authToken =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("employeeToken") ||
    localStorage.getItem("token") ||
    "";

  socketUserId = userId;
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    ...(authToken ? { auth: { token: authToken } } : {}),
    reconnection: true,
  });

  socket.on("connect", () => {
    socket.emit("chat:register", { userId });

    // Catch up on anything sent while we were offline.
    fetchServerUnread(userId).then((counts) => {
      if (counts && chatViewsOpen === 0) saveUnread(userId, counts);
    });
  });

  socket.on("chat:message", (message) => {
    const conversationId = message?.conversation_id ?? message?.conversationId;
    const senderId = message?.sender_id ?? message?.user_id;
    const isGroup = message?.conversation_type === "group";

    if (conversationId == null) return;

    const key = isGroup ? `group-${conversationId}` : `direct-${senderId}`;
    clearTypingKey(key);

    if (chatViewsOpen > 0) return;
    if (senderId == null || Number(senderId) === Number(userId)) return;

    const counts = loadUnread(userId);
    saveUnread(userId, { ...counts, [key]: (counts[key] || 0) + 1 });
  });

  socket.on("chat:typing", ({ conversationId, conversationType, userId: typerId, isTyping }) => {
    if (!conversationId || !typerId) return;

    const key =
      conversationType === "group"
        ? `group-${conversationId}`
        : `direct-${typerId}`;

    if (!isTyping) {
      clearTypingKey(key);
      return;
    }

    // Drop stale indicators if the "stopped typing" event never arrives.
    clearTimeout(typingKeys[key]);
    typingKeys[key] = setTimeout(() => clearTypingKey(key), TYPING_EXPIRE_MS);
    notifyTyping();
  });
};

// =====================================================
// HOOK
// =====================================================

export const useChatNotifications = (role) => {
  const userId = getChatUserId(role);

  const [unread, setUnread] = useState(() => totalUnread(loadUnread(userId)));
  const [typing, setTyping] = useState(
    () => Object.keys(typingKeys).length > 0
  );

  useEffect(() => {
    if (!userId) return undefined;

    ensureSocket(userId);

    const refreshUnread = () => setUnread(totalUnread(loadUnread(userId)));
    const refreshTyping = () => setTyping(Object.keys(typingKeys).length > 0);

    // The "storage" event keeps other open tabs in sync.
    const handleStorage = (event) => {
      if (event.key === unreadStorageKey(userId)) refreshUnread();
    };

    refreshUnread();
    refreshTyping();

    window.addEventListener(UNREAD_EVENT, refreshUnread);
    window.addEventListener(TYPING_EVENT, refreshTyping);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(UNREAD_EVENT, refreshUnread);
      window.removeEventListener(TYPING_EVENT, refreshTyping);
      window.removeEventListener("storage", handleStorage);
    };
  }, [userId]);

  return { unread, typing };
};
