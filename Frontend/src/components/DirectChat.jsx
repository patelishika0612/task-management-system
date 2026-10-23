
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../api";
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
  contact?.employee_name ||
  contact?.Employee_Name ||
  contact?.full_name ||
  contact?.username ||
  contact?.email ||
  `User ${getContactId(contact) ?? ""}`;

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

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const conversationRef = useRef(null);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    conversationRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

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

    const joinCurrentConversation = () => {
      setSocketConnected(true);

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

      if (
        incomingId == null ||
        Number(incomingId) !== Number(conversationRef.current)
      ) {
        return;
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

    const handleDisconnect = () => setSocketConnected(false);

    const handleConnectError = (err) => {
      console.error("Chat socket connection error:", err.message);
      setSocketConnected(false);
    };

    socket.on("connect", joinCurrentConversation);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("chat:message", handleIncomingMessage);

    return () => {
      socket.off("connect", joinCurrentConversation);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("chat:message", handleIncomingMessage);
      socket.disconnect();

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
    loadGroups();
  }, [loadGroups]);

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
        setConversationId(id);

        const historyResult = await request(
          `/chat/${encodeURIComponent(id)}/messages?userId=${encodeURIComponent(currentUserId)}`
        );

        setMessages(normalizeMessages(historyResult));
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
    [currentUserId, request]
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

        conversationRef.current = id;
        setConversationId(id);
        setMessages(normalizeMessages(historyResult));
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
    [currentUserId, request]
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
        }

        setMessageText("");
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
    [currentUserId, messageText, request, sending]
  );

  // =====================================================
  // FILTER CONTACTS
  // =====================================================

  const filteredContacts = contacts.filter((contact) =>
    getContactName(contact)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    String(group.name || "Group")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="direct-chat">
      <aside className="direct-chat__sidebar">
        <div className="direct-chat__sidebar-header">
          <h3>{chatMode === "direct" ? "Direct Messages" : "Group Chats"}</h3>

          <span
            className={`direct-chat__connection ${
              socketConnected ? "is-connected" : "is-disconnected"
            }`}
            title={socketConnected ? "Connected" : "Disconnected"}
          >
            {socketConnected ? "Online" : "Connecting…"}
          </span>
        </div>

        <div className="direct-chat__tabs">
          <button
            type="button"
            className={chatMode === "direct" ? "is-active" : ""}
            onClick={() => {
              setChatMode("direct");
              setSearch("");
              setError("");
            }}
          >
            Direct
          </button>

          <button
            type="button"
            className={chatMode === "groups" ? "is-active" : ""}
            onClick={() => {
              setChatMode("groups");
              setSearch("");
              setError("");
              loadGroups();
            }}
          >
            Groups
          </button>
        </div>

        <div className="direct-chat__search">
          <input
            type="search"
            placeholder={
              chatMode === "direct"
                ? "Search contacts..."
                : "Search groups..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search chats"
          />
        </div>

        {chatMode === "groups" && (
          <div className="direct-chat__create-button-wrap">
            <button
              type="button"
              onClick={() => {
                setShowCreateGroup((previous) => !previous);
                setError("");
              }}
            >
              {showCreateGroup ? "Cancel" : "+ Create Group"}
            </button>
          </div>
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

            {contacts
              .filter(
                (contact) =>
                  Number(getContactId(contact)) !== Number(currentUserId)
              )
              .map((contact) => {
                const rawId = getContactId(contact);
                const memberId = Number(rawId);

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

            {contacts.filter(
              (contact) =>
                Number(getContactId(contact)) !== Number(currentUserId)
            ).length === 0 && (
              <p className="direct-chat__empty">
                No other employees available.
              </p>
            )}

            <button
              type="submit"
              disabled={creatingGroup}
            >
              {creatingGroup ? "Creating..." : "Create Group"}
            </button>
          </form>
        )}

        <div className="direct-chat__contacts">
          {chatMode === "direct" ? (
            filteredContacts.length === 0 ? (
              <p className="direct-chat__empty">No contacts found.</p>
            ) : (
              filteredContacts.map((contact) => {
                const contactId = getContactId(contact);

                const selected =
                  !activeContact?.isGroup &&
                  String(getContactId(activeContact)) ===
                    String(contactId);

                return (
                  <button
                    type="button"
                    key={contactId}
                    className={`direct-chat__contact ${
                      selected ? "is-active" : ""
                    }`}
                    onClick={() => openConversation(contact)}
                  >
                    <span className="direct-chat__avatar">
                      {getContactName(contact).charAt(0).toUpperCase()}
                    </span>

                    <span className="direct-chat__contact-info">
                      <span className="direct-chat__contact-name">
                        {getContactName(contact)}
                      </span>

                      <span className="direct-chat__contact-status">
                        {contact?.department_name ||
                          contact?.department ||
                          contact?.role ||
                          "Contact"}
                      </span>
                    </span>
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
                group.conversationId ??
                group.conversation_id ??
                group.id;

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
                  <span className="direct-chat__avatar">G</span>

                  <span className="direct-chat__contact-info">
                    <span className="direct-chat__contact-name">
                      {group.name || "Group"}
                    </span>

                    <span className="direct-chat__contact-status">
                      {group.memberCount ?? 0} members
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="direct-chat__main">
        {!activeContact ? (
          <div className="direct-chat__welcome">
            <div className="direct-chat__welcome-icon">💬</div>
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
              <span className="direct-chat__avatar">
                {activeContact.isGroup
                  ? "G"
                  : getContactName(activeContact).charAt(0).toUpperCase()}
              </span>

              <div>
                <h3>{getContactName(activeContact)}</h3>
                <p>
                  {activeContact.isGroup ? "Group conversation" : "Direct message"}
                  {" · "}
                  {socketConnected ? "Connected" : "Connecting..."}
                </p>
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
                  ×
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

                  const messageId = getMessageId(message);
                  const time = getMessageTime(message);

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
                      <div className="direct-chat__bubble">
                        {activeContact.isGroup && !isMine && (
                          <small className="direct-chat__sender">
                            {message.sender_name ||
                              message.employee_name ||
                              `User ${senderId ?? ""}`}
                          </small>
                        )}

                        <p>{getMessageText(message)}</p>

                        <span className="direct-chat__time">
                          {time && !Number.isNaN(new Date(time).getTime())
                            ? new Date(time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
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
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                disabled={!conversationId || sending}
                aria-label="Type a message"
                autoComplete="off"
              />

              <button
                type="submit"
                disabled={
                  !conversationId || !messageText.trim() || sending
                }
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
