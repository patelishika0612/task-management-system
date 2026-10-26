import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import API from "../api";
import DirectChat from "../components/DirectChat";
import { getChatUserId } from "../chatNotifications";
import "./ChatPage.css";

const getArray = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : [];
};

// Shared chat page used by both the admin and employee/HR panels.
const ChatPage = ({ layout: Layout, role = "admin" }) => {
  const isAdmin = role === "admin";

  const currentUserId = getChatUserId(role);

  const token = isAdmin
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token") ||
      localStorage.getItem("employeeToken") ||
      localStorage.getItem("adminToken");

  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    API.get("/chat/contacts")
      .then((response) => {
        if (cancelled) return;

        // Hide the logged-in user from their own contact list.
        setContacts(
          getArray(response).filter(
            (contact) => String(contact.user_id) !== String(currentUserId)
          )
        );
      })
      .catch((err) => {
        console.error("Chat contacts fetch error:", err);
        if (!cancelled) setError("Unable to load contacts.");
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  return (
    <Layout>
      <div className="chat-page">
        <nav className="chat-page__breadcrumb" aria-label="Breadcrumb">
          <Link to={isAdmin ? "/admindashboard" : "/employeedashboard"}>
            <Home size={15} />
            Home
          </Link>
          <ChevronRight size={14} />
          <span>Chat</span>
        </nav>

        {error && (
          <div className="chat-page__error" role="alert">
            {error}
          </div>
        )}

        {currentUserId ? (
          <DirectChat
            currentUserId={currentUserId}
            contacts={contacts}
            token={token}
          />
        ) : (
          <div className="chat-page__error" role="alert">
            Your user ID was not found. Please log in again.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatPage;
