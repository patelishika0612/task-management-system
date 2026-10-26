import { useChatNotifications } from "../chatNotifications";
import "./ChatSidebarBadge.css";

// Unread count + "typing..." shown next to the Chat item in the app sidebar.
const ChatSidebarBadge = ({ role }) => {
  const { unread, typing } = useChatNotifications(role);

  if (!unread && !typing) return null;

  return (
    <span className="chat-sidebar-badge">
      {typing && <span className="chat-sidebar-badge__typing">typing...</span>}
      {unread > 0 && (
        <span
          className="chat-sidebar-badge__count"
          title={`${unread} new message${unread === 1 ? "" : "s"}`}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </span>
  );
};

export default ChatSidebarBadge;
