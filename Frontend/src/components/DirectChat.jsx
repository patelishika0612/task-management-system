
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  SendHorizontal,
  Users,
  X,
} from "lucide-react";
import API from "../api";
import {
  fetchServerUnread,
  loadUnread,
  saveUnread,
  setChatViewOpen,
} from "../chatNotifications";
import { getImageUrl } from "../imageHelper";
import "./DirectChat.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  API_URL.replace(/\/api\/?$/i, "")
).replace(/\/+$/, "");

const getContactId = (contact) =>
  contact?.emp_id ??
  contact?.employee_id ??
  contact?.user_id ??
  contact?.id ??
  contact?.Employee_ID ??
  contact?.Admin_ID ??
  null;

const getContactName = (contact) =>
  contact?.name ||
  contact?.emp_name ||
  contact?.employee_name ||
  contact?.Employee_Name ||
  contact?.full_name ||
  contact?.username ||
  contact?.email ||
  `User ${getContactId(contact) ?? ""}`;

const getContactSubtitle = (contact) =>
  contact?.department_name ||
  contact?.department ||
  contact?.designation ||
  contact?.role ||
  "Contact";

const getInitials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const AVATAR_COLORS = [
  "#5b57d1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

const getAvatarColor = (seed) => {
  const text = String(seed ?? "");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Avatar = ({ name, image, seed, isGroup = false, online = false }) => (
  <span
    className="direct-chat__avatar"
    style={{ background: getAvatarColor(seed ?? name) }}
  >
    {image ? (
      <img src={getImageUrl(image)} alt={name} />
    ) : isGroup ? (
      <Users size={20} />
    ) : (
      getInitials(name)
    )}
    {online && <span className="direct-chat__presence" />}
  </span>
);

const getMessageId = (message) =>
  message?.id ??
  message?.message_id ??
  message?.Message_ID ??
  message?.chat_message_id ??
  null;

const getMessageText = (message) =>
  message?.message ??
  message?.content ??
  message?.text ??
  message?.Message ??
  "";

const getSenderId = (message) =>
  message?.sender_id ??
  message?.user_id ??
  message?.emp_id ??
  message?.senderId ??
  message?.User_ID ??
  message?.Employee_ID ??
  null;

const getMessageTime = (message) =>
  message?.created_at ??
  message?.sent_at ??
  message?.createdAt ??
  message?.timestamp ??
  null;

const extractData = (result) =>
  result?.data?.data ??
  result?.data?.messages ??
  result?.data?.conversation ??
  result?.data ??
  result;

const TYPING_EXPIRE_MS = 4000;
const TYPING_IDLE_MS = 2000;
const TYPING_RESEND_MS = 2500;

const getDirectKey = (userId) => `direct-${userId}`;
const getGroupKey = (conversationId) => `group-${conversationId}`;

const getPreviewText = (message) =>
  getMessageText(message) ||
  message?.file_name ||
  (message?.message_type && message.message_type !== "text"
    ? "Attachment"
    : "");

const toTimestamp = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? Date.now() : time;
};

const normalizeMessages = (result) => {
  const data = extractData(result);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
};

export default function DirectChat({
  currentUserId,
  contacts = [],
  token = "",
}) {
  const [chatMode, setChatMode] = useState("direct");
  const [activeContact, setActiveContact] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sidebar activity, keyed by getDirectKey / getGroupKey.
  // Seeded from messages that arrived while the chat page was closed.
  const [unreadCounts, setUnreadCounts] = useState(() =>
    loadUnread(currentUserId)
  );
  const [lastMessages, setLastMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  const socketRef = useRef(null);
  const conversationKeysRef = useRef({});
  const knownGroupIdsRef = useRef(new Set());
  const loadGroupsRef = useRef(null);
  const typingExpireTimersRef = useRef({});
  const typingConversationRef = useRef(null);
  const typingSentAtRef = useRef(0);
  const typingIdleTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const conversationRef = useRef(null);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    conversationRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Share unread counts with the app sidebar badge.
  useEffect(() => {
    saveUnread(currentUserId, unreadCounts);
  }, [currentUserId, unreadCounts]);

  // Pick up messages that arrived while we were offline.
  useEffect(() => {
    let cancelled = false;

    fetchServerUnread(currentUserId).then((counts) => {
      if (cancelled || !counts) return;

      const openKey = conversationKeysRef.current[conversationRef.current];
      if (openKey) delete counts[openKey];

      setUnreadCounts(counts);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    setChatViewOpen(true);
    return () => setChatViewOpen(false);
  }, []);

  // =====================================================
  // API HELPER
  // =====================================================

  const request = useCallback(async (url, options = {}) => {
    const response = await API.request({
      url,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: options.headers,
    });

    return response.data;
  }, []);

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  useEffect(() => {
    if (!currentUserId) return undefined;

    const authToken =
      token ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("employeeToken") ||
      localStorage.getItem("token") ||
      "";

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      ...(authToken ? { auth: { token: authToken } } : {}),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const clearTyping = (key) => {
      clearTimeout(typingExpireTimersRef.current[key]);
      delete typingExpireTimersRef.current[key];

      setTypingUsers((previous) => {
        if (!(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    };

    const joinCurrentConversation = () => {
      setSocketConnected(true);

      socket.emit("chat:register", { userId: currentUserIdRef.current });

      const id = conversationRef.current;
      if (!id) return;

      socket.emit("chat:join", { conversationId: id }, (reply) => {
        if (reply?.ok === false) {
          setError(reply.message || "Could not join chat room.");
        }
      });
    };

    const handleIncomingMessage = (newMessage) => {
      if (!newMessage) return;

      const incomingId =
        newMessage.conversation_id ??
        newMessage.conversationId ??
        newMessage.conversation?.id;

      if (incomingId == null) return;

      const senderId = getSenderId(newMessage);
      const isMine =
        senderId != null &&
        Number(senderId) === Number(currentUserIdRef.current);
      const isGroup = newMessage.conversation_type === "group";

      let key = conversationKeysRef.current[incomingId];

      if (!key) {
        if (isGroup) key = getGroupKey(incomingId);
        else if (!isMine && senderId != null) key = getDirectKey(senderId);
      }

      if (key) {
        conversationKeysRef.current[incomingId] = key;
        clearTyping(key);

        setLastMessages((previous) => ({
          ...previous,
          [key]: {
            text: getPreviewText(newMessage),
            time: toTimestamp(getMessageTime(newMessage)),
            isMine,
          },
        }));
      }

      // A group someone else just added us to.
      if (isGroup && !knownGroupIdsRef.current.has(Number(incomingId))) {
        loadGroupsRef.current?.();
      }

      const isOpen = Number(incomingId) === Number(conversationRef.current);

      if (!isOpen) {
        if (key && !isMine) {
          setUnreadCounts((previous) => ({
            ...previous,
            [key]: (previous[key] || 0) + 1,
          }));
        }
        return;
      }

      // Seen live in the open conversation, so tell the server it's read.
      if (!isMine) {
        API.post(`/chat/${encodeURIComponent(incomingId)}/read`, {
          userId: Number(currentUserIdRef.current),
        }).catch((err) => console.error("Mark chat read error:", err));
      }

      setMessages((previous) => {
        const newId = getMessageId(newMessage);

        if (
          newId != null &&
          previous.some(
            (item) =>
              String(getMessageId(item)) === String(newId)
          )
        ) {
          return previous;
        }

        return [...previous, newMessage];
      });
    };

    const handleTyping = ({
      conversationId: typingConversationId,
      conversationType,
      userId,
      isTyping,
    } = {}) => {
      if (!typingConversationId || !userId) return;

      const key =
        conversationType === "group"
          ? getGroupKey(typingConversationId)
          : getDirectKey(userId);

      conversationKeysRef.current[typingConversationId] = key;

      if (!isTyping) {
        clearTyping(key);
        return;
      }

      setTypingUsers((previous) =>
        previous[key] === userId ? previous : { ...previous, [key]: userId }
      );

      // Drop stale indicators if the "stopped typing" event never arrives.
      clearTimeout(typingExpireTimersRef.current[key]);
      typingExpireTimersRef.current[key] = setTimeout(
        () => clearTyping(key),
        TYPING_EXPIRE_MS
      );
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleConnectError = (err) => {
      console.error("Chat socket connection error:", err.message);
      setSocketConnected(false);
    };

    socket.on("connect", joinCurrentConversation);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("chat:message", handleIncomingMessage);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("connect", joinCurrentConversation);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("chat:message", handleIncomingMessage);
      socket.off("chat:typing", handleTyping);
      socket.disconnect();

      Object.values(typingExpireTimersRef.current).forEach(clearTimeout);
      typingExpireTimersRef.current = {};
      clearTimeout(typingIdleTimerRef.current);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [currentUserId, token]);

  useEffect(() => {
    if (!conversationId || !socketRef.current?.connected) return;

    socketRef.current.emit(
      "chat:join",
      { conversationId },
      (reply) => {
        if (reply?.ok === false) {
          setError(reply.message || "Could not join chat room.");
        }
      }
    );
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // =====================================================
  // TYPING INDICATOR (OUTGOING)
  // =====================================================

  const stopTyping = useCallback(() => {
    clearTimeout(typingIdleTimerRef.current);

    const id = typingConversationRef.current;
    typingConversationRef.current = null;
    typingSentAtRef.current = 0;

    if (id && socketRef.current?.connected) {
      socketRef.current.emit("chat:typing", {
        conversationId: id,
        userId: Number(currentUserIdRef.current),
        isTyping: false,
      });
    }
  }, []);

  const handleMessageChange = (event) => {
    setMessageText(event.target.value);

    const id = conversationRef.current;
    const socket = socketRef.current;
    if (!id || !socket?.connected) return;

    if (typingConversationRef.current !== id) stopTyping();

    const now = Date.now();

    if (now - typingSentAtRef.current > TYPING_RESEND_MS) {
      socket.emit("chat:typing", {
        conversationId: id,
        userId: Number(currentUserId),
        isTyping: true,
      });
      typingConversationRef.current = id;
      typingSentAtRef.current = now;
    }

    clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const markRead = (key) =>
    setUnreadCounts((previous) =>
      previous[key] ? { ...previous, [key]: 0 } : previous
    );

  const rememberLastMessage = (key, history) => {
    const last = history[history.length - 1];
    if (!last) return;

    setLastMessages((previous) => ({
      ...previous,
      [key]: {
        text: getPreviewText(last),
        time: toTimestamp(getMessageTime(last)),
        isMine: Number(getSenderId(last)) === Number(currentUserId),
      },
    }));
  };

  // =====================================================
  // LOAD GROUPS
  // =====================================================

  const loadGroups = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingGroups(true);

    try {
      const result = await request(
        `/chat/groups?userId=${encodeURIComponent(currentUserId)}`
      );

      const data = extractData(result);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load groups error:", err);
      setError("Unable to load groups.");
    } finally {
      setLoadingGroups(false);
    }
  }, [currentUserId, request]);

  useEffect(() => {
    loadGroupsRef.current = loadGroups;
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    knownGroupIdsRef.current = new Set(
      groups.map((group) =>
        Number(group.conversationId ?? group.conversation_id ?? group.id)
      )
    );
  }, [groups]);

  // =====================================================
  // OPEN DIRECT CHAT
  // =====================================================

  const openConversation = useCallback(
    async (contact) => {
      const otherUserId = getContactId(contact);

      if (!currentUserId) {
        setError("Current user ID is missing. Please log in again.");
        return;
      }

      if (
        !otherUserId ||
        Number(otherUserId) === Number(currentUserId)
      ) {
        setError("Please select a valid different contact.");
        return;
      }

      const key = getDirectKey(otherUserId);

      stopTyping();
      markRead(key);
      setChatMode("direct");
      setActiveContact(contact);
      setConversationId(null);
      conversationRef.current = null;
      setMessages([]);
      setMessageText("");
      setError("");
      setLoadingMessages(true);

      try {
        const result = await request("/chat/direct", {
          method: "POST",
          body: JSON.stringify({
            userId: Number(otherUserId),
            currentUserId: Number(currentUserId),
          }),
        });

        const data = extractData(result);

        const id =
          data?.conversationId ??
          data?.conversation_id ??
          data?.id ??
          data?.conversation?.id;

        if (!id) {
          throw new Error("Conversation ID was not returned.");
        }

        conversationRef.current = id;
        conversationKeysRef.current[id] = key;
        setConversationId(id);

        const historyResult = await request(
          `/chat/${encodeURIComponent(id)}/messages?userId=${encodeURIComponent(currentUserId)}`
        );

        const history = normalizeMessages(historyResult);
        setMessages(history);
        rememberLastMessage(key, history);
        markRead(key);
      } catch (err) {
        console.error("Open direct chat error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to open conversation."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId, request, stopTyping]
  );

  // =====================================================
  // OPEN GROUP CHAT
  // =====================================================

  const openGroupConversation = useCallback(
    async (group) => {
      const id =
        group.conversationId ??
        group.conversation_id ??
        group.id;

      if (!id || !currentUserId) {
        setError("Group or current user ID is missing.");
        return;
      }

      const groupContact = {
        id,
        name: group.name || "Group",
        role: "Group",
        isGroup: true,
      };

      const key = getGroupKey(id);

      stopTyping();
      markRead(key);
      setChatMode("groups");
      setActiveContact(groupContact);
      setConversationId(null);
      conversationRef.current = null;
      setMessages([]);
      setMessageText("");
      setError("");
      setLoadingMessages(true);

      try {
        const historyResult = await request(
          `/chat/${encodeURIComponent(id)}/messages?userId=${encodeURIComponent(currentUserId)}`
        );

        const history = normalizeMessages(historyResult);

        conversationRef.current = id;
        conversationKeysRef.current[id] = key;
        setConversationId(id);
        setMessages(history);
        rememberLastMessage(key, history);
        markRead(key);
      } catch (err) {
        console.error("Open group error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to open group."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId, request, stopTyping]
  );

  // =====================================================
  // CREATE GROUP
  // =====================================================

  const handleCreateGroup = useCallback(
    async (event) => {
      event.preventDefault();

      const name = groupName.trim();

      if (!name) {
        setError("Please enter a group name.");
        return;
      }

      if (selectedMemberIds.length < 2) {
        setError("Please select at least two other members.");
        return;
      }

      setCreatingGroup(true);
      setError("");

      try {
        const result = await request("/chat/group", {
          method: "POST",
          body: JSON.stringify({
            name,
            currentUserId: Number(currentUserId),
            memberIds: selectedMemberIds.map(Number),
          }),
        });

        const data = extractData(result);

        if (!data?.conversationId) {
          throw new Error(data?.message || "Group was not created.");
        }

        const newGroup = {
          conversationId: data.conversationId,
          name: data.name || name,
          memberCount: selectedMemberIds.length + 1,
        };

        setGroups((previous) => [
          newGroup,
          ...previous.filter(
            (group) =>
              Number(group.conversationId ?? group.id) !==
              Number(newGroup.conversationId)
          ),
        ]);

        setGroupName("");
        setSelectedMemberIds([]);
        setShowCreateGroup(false);

        await openGroupConversation(newGroup);
      } catch (err) {
        console.error("Create group error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to create group."
        );
      } finally {
        setCreatingGroup(false);
      }
    },
    [
      currentUserId,
      groupName,
      selectedMemberIds,
      request,
      openGroupConversation,
    ]
  );

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = useCallback(
    async (event) => {
      event.preventDefault();

      const text = messageText.trim();
      const id = conversationRef.current;

      if (!text || !id || sending) return;

      if (!currentUserId) {
        setError("Current user ID is missing.");
        return;
      }

      stopTyping();
      setSending(true);
      setError("");

      try {
        const result = await request(
          `/chat/${encodeURIComponent(id)}/messages`,
          {
            method: "POST",
            body: JSON.stringify({
              userId: Number(currentUserId),
              message: text,
              messageType: "text",
            }),
          }
        );

        const saved = extractData(result);
        const message = saved?.message ?? saved;

        if (message && typeof message === "object") {
          setMessages((previous) => {
            const newId = getMessageId(message);

            if (
              newId != null &&
              previous.some(
                (item) =>
                  String(getMessageId(item)) === String(newId)
              )
            ) {
              return previous;
            }

            return [...previous, message];
          });

          const key = conversationKeysRef.current[id];

          if (key) {
            setLastMessages((previous) => ({
              ...previous,
              [key]: {
                text: getPreviewText(message) || text,
                time: toTimestamp(getMessageTime(message)),
                isMine: true,
              },
            }));
          }
        }

        setMessageText("");
        messageInputRef.current?.focus();
      } catch (err) {
        console.error("Send message error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to send message."
        );
      } finally {
        setSending(false);
      }
    },
    [currentUserId, messageText, request, sending, stopTyping]
  );

  // =====================================================
  // FILTER CONTACTS
  // =====================================================

  // Most recent conversation first, like other chat apps.
  const byRecentActivity = (getKey) => (a, b) =>
    (lastMessages[getKey(b)]?.time || 0) -
    (lastMessages[getKey(a)]?.time || 0);

  const contactKey = (contact) => getDirectKey(getContactId(contact));
  const groupKey = (group) =>
    getGroupKey(group.conversationId ?? group.conversation_id ?? group.id);

  const filteredContacts = contacts
    .filter((contact) =>
      getContactName(contact)
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .sort(byRecentActivity(contactKey));

  const filteredGroups = groups
    .filter((group) =>
      String(group.name || "Group")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .sort(byRecentActivity(groupKey));

  const sumUnread = (prefix) =>
    Object.entries(unreadCounts).reduce(
      (total, [key, count]) =>
        key.startsWith(prefix) ? total + count : total,
      0
    );

  const directUnread = sumUnread("direct-");
  const groupUnread = sumUnread("group-");

  const findContact = (userId) =>
    contacts.find(
      (contact) => String(getContactId(contact)) === String(userId)
    );

  const getTyperName = (userId) => {
    const typer = findContact(userId);
    return typer ? getContactName(typer).split(/\s+/)[0] : "Someone";
  };

  const getSenderName = (message, senderId) => {
    const sender = findContact(senderId);

    return sender
      ? getContactName(sender)
      : message.sender_name || message.employee_name || `User ${senderId ?? ""}`;
  };

  const renderActivity = (key, fallback, isGroup = false) => {
    const typingUserId = typingUsers[key];

    if (typingUserId) {
      return (
        <span className="direct-chat__contact-status is-typing">
          {isGroup ? `${getTyperName(typingUserId)} is typing...` : "typing..."}
        </span>
      );
    }

    const last = lastMessages[key];

    return (
      <span
        className={`direct-chat__contact-status ${
          unreadCounts[key] ? "is-unread" : ""
        }`}
      >
        {last ? `${last.isMine ? "You: " : ""}${last.text}` : fallback}
      </span>
    );
  };

  const renderMeta = (key) => {
    const last = lastMessages[key];
    const unread = unreadCounts[key] || 0;

    if (!last && !unread) return null;

    return (
      <span className="direct-chat__contact-meta">
        {last && (
          <span className="direct-chat__contact-time">
            {formatTime(last.time)}
          </span>
        )}
        {unread > 0 && (
          <span className="direct-chat__unread-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </span>
    );
  };

  const renderTabBadge = (count) =>
    count > 0 && (
      <span className="direct-chat__tab-badge">
        {count > 99 ? "99+" : count}
      </span>
    );

  const activeKey = activeContact
    ? activeContact.isGroup
      ? getGroupKey(activeContact.id)
      : getDirectKey(getContactId(activeContact))
    : null;
  const activeTypingUserId = activeKey ? typingUsers[activeKey] : null;

  // =====================================================
  // RENDER
  // =====================================================

  const closeConversation = () => {
    stopTyping();
    setActiveContact(null);
    setConversationId(null);
    conversationRef.current = null;
    setMessages([]);
    setMenuOpen(false);
  };

  const switchMode = (mode) => {
    setChatMode(mode);
    setSearch("");
    setError("");
    if (mode === "groups") loadGroups();
    else setShowCreateGroup(false);
  };

  return (
    <div
      className={`direct-chat ${activeContact ? "has-active-chat" : ""}`}
    >
      <aside className="direct-chat__sidebar">
        <div className="direct-chat__search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search chats"
          />
        </div>

        <div className="direct-chat__tabs">
          <button
            type="button"
            className={chatMode === "direct" ? "is-active" : ""}
            onClick={() => switchMode("direct")}
          >
            Direct
            {renderTabBadge(directUnread)}
          </button>

          <button
            type="button"
            className={chatMode === "groups" ? "is-active" : ""}
            onClick={() => switchMode("groups")}
          >
            Groups
            {renderTabBadge(groupUnread)}
          </button>
        </div>

        {chatMode === "groups" && (
          <button
            type="button"
            className="direct-chat__create-toggle"
            onClick={() => {
              setShowCreateGroup((previous) => !previous);
              setError("");
            }}
          >
            {showCreateGroup ? <X size={16} /> : <Plus size={16} />}
            {showCreateGroup ? "Cancel" : "Create Group"}
          </button>
        )}

        {showCreateGroup && chatMode === "groups" && (
          <form
            className="direct-chat__create-group"
            onSubmit={handleCreateGroup}
          >
            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              maxLength={150}
              required
            />

            <p>Select at least two other members:</p>

            <div className="direct-chat__member-list">
              {contacts
                .filter(
                  (contact) =>
                    Number(getContactId(contact)) !== Number(currentUserId)
                )
                .map((contact) => {
                  const memberId = Number(getContactId(contact));

                  if (!Number.isInteger(memberId) || memberId <= 0) {
                    return null;
                  }

                  return (
                    <label
                      key={memberId}
                      className="direct-chat__member-option"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(memberId)}
                        onChange={(event) => {
                          setSelectedMemberIds((previous) =>
                            event.target.checked
                              ? [...new Set([...previous, memberId])]
                              : previous.filter((id) => id !== memberId)
                          );
                        }}
                      />

                      <span>{getContactName(contact)}</span>
                    </label>
                  );
                })}
            </div>

            {contacts.length === 0 && (
              <p className="direct-chat__empty">No other employees available.</p>
            )}

            <button type="submit" disabled={creatingGroup}>
              {creatingGroup ? "Creating..." : "Create Group"}
            </button>
          </form>
        )}

        {!activeContact && error && (
          <div className="direct-chat__error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="direct-chat__contacts">
          {chatMode === "direct" ? (
            filteredContacts.length === 0 ? (
              <p className="direct-chat__empty">No contacts found.</p>
            ) : (
              filteredContacts.map((contact) => {
                const contactId = getContactId(contact);
                const name = getContactName(contact);

                const selected =
                  !activeContact?.isGroup &&
                  String(getContactId(activeContact)) === String(contactId);

                return (
                  <button
                    type="button"
                    key={contactId}
                    className={`direct-chat__contact ${
                      selected ? "is-active" : ""
                    }`}
                    onClick={() => openConversation(contact)}
                  >
                    <Avatar
                      name={name}
                      image={contact?.image}
                      seed={contactId}
                    />

                    <span className="direct-chat__contact-info">
                      <span className="direct-chat__contact-name">{name}</span>
                      {renderActivity(
                        getDirectKey(contactId),
                        getContactSubtitle(contact)
                      )}
                    </span>

                    {renderMeta(getDirectKey(contactId))}
                  </button>
                );
              })
            )
          ) : loadingGroups ? (
            <p className="direct-chat__empty">Loading groups...</p>
          ) : filteredGroups.length === 0 ? (
            <p className="direct-chat__empty">No groups found.</p>
          ) : (
            filteredGroups.map((group) => {
              const id =
                group.conversationId ?? group.conversation_id ?? group.id;

              const selected =
                activeContact?.isGroup &&
                Number(conversationId) === Number(id);

              return (
                <button
                  type="button"
                  key={id}
                  className={`direct-chat__contact ${
                    selected ? "is-active" : ""
                  }`}
                  onClick={() => openGroupConversation(group)}
                >
                  <Avatar name={group.name} seed={`group-${id}`} isGroup />

                  <span className="direct-chat__contact-info">
                    <span className="direct-chat__contact-name">
                      {group.name || "Group"}
                    </span>
                    {renderActivity(
                      getGroupKey(id),
                      `${group.memberCount ?? 0} members`,
                      true
                    )}
                  </span>

                  {renderMeta(getGroupKey(id))}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="direct-chat__main">
        {!activeContact ? (
          <div className="direct-chat__welcome">
            <div className="direct-chat__welcome-icon">
              <MessageCircle size={30} />
            </div>
            <h3>{chatMode === "groups" ? "Your groups" : "Your messages"}</h3>
            <p>
              {chatMode === "groups"
                ? "Select a group or create a new one."
                : "Select a contact to start chatting."}
            </p>
          </div>
        ) : (
          <>
            <header className="direct-chat__header">
              <button
                type="button"
                className="direct-chat__back"
                onClick={closeConversation}
                aria-label="Back to contacts"
              >
                <ArrowLeft size={20} />
              </button>

              <Avatar
                name={getContactName(activeContact)}
                image={activeContact.image}
                seed={
                  activeContact.isGroup
                    ? `group-${activeContact.id}`
                    : getContactId(activeContact)
                }
                isGroup={activeContact.isGroup}
                online={socketConnected && !activeContact.isGroup}
              />

              <div className="direct-chat__header-info">
                <h3>{getContactName(activeContact)}</h3>
                {activeTypingUserId ? (
                  <p className="is-typing">
                    {activeContact.isGroup
                      ? `${getTyperName(activeTypingUserId)} is typing...`
                      : "typing..."}
                  </p>
                ) : (
                  <p>
                    {activeContact.isGroup
                      ? "Group conversation"
                      : getContactSubtitle(activeContact)}
                  </p>
                )}
              </div>

              <div className="direct-chat__menu">
                <button
                  type="button"
                  className="direct-chat__icon-btn"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="More options"
                  aria-expanded={menuOpen}
                >
                  <MoreVertical size={18} />
                </button>

                {menuOpen && (
                  <div className="direct-chat__menu-list" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        if (activeContact.isGroup) {
                          openGroupConversation({
                            conversationId: activeContact.id,
                            name: activeContact.name,
                          });
                        } else {
                          openConversation(activeContact);
                        }
                      }}
                    >
                      Refresh messages
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={closeConversation}
                    >
                      Close chat
                    </button>
                  </div>
                )}
              </div>
            </header>

            {error && (
              <div className="direct-chat__error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="direct-chat__messages">
              {loadingMessages ? (
                <p className="direct-chat__empty">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="direct-chat__empty">
                  <p>No messages yet.</p>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId = getSenderId(message);
                  const isMine =
                    senderId != null &&
                    Number(senderId) === Number(currentUserId);

                  // Show the time only under the last bubble of a run
                  // of messages from the same sender.
                  const next = messages[index + 1];
                  const isLastInRun =
                    !next ||
                    String(getSenderId(next)) !== String(senderId);

                  const messageId = getMessageId(message);

                  return (
                    <div
                      key={
                        messageId != null
                          ? `message-${messageId}`
                          : `message-${index}`
                      }
                      className={`direct-chat__message-row ${
                        isMine ? "is-mine" : "is-theirs"
                      }`}
                    >
                      {activeContact.isGroup && !isMine && (
                        <small className="direct-chat__sender">
                          {getSenderName(message, senderId)}
                        </small>
                      )}

                      <div className="direct-chat__bubble">
                        {getMessageText(message)}
                      </div>

                      {isLastInRun && (
                        <span className="direct-chat__time">
                          {formatTime(getMessageTime(message))}
                        </span>
                      )}
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="direct-chat__composer"
              onSubmit={handleSendMessage}
            >
              <input
                ref={messageInputRef}
                type="text"
                placeholder={
                  conversationId
                    ? `Message ${getContactName(activeContact)}`
                    : "Connecting..."
                }
                value={messageText}
                onChange={handleMessageChange}
                disabled={!conversationId}
                aria-label="Type a message"
                autoComplete="off"
                maxLength={2000}
              />

              <button
                type="submit"
                disabled={!conversationId || !messageText.trim() || sending}
                aria-label="Send message"
              >
                <span>{sending ? "Sending..." : "Send"}</span>
                <SendHorizontal size={18} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
