import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Random ID generator
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initialize socket connection
const socket = io("http://localhost:3030", {
  query: { id: getRandomInt(1, 100) },
  withCredentials: true,
});

const App = () => {
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectUser, setSelectUser] = useState("");
  const messageEndRef = useRef(null); // Reference for the end of the messages container

  useEffect(() => {
    socket.on("user_list", (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off("user_list");
    };
  }, []);

  useEffect(() => {
    // Listen for incoming messages
    socket.on("private_message", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: data.senderId, text: data.message },
      ]);
    });

    return () => {
      socket.off("private_message");
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat container every time messages change
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]); // Trigger this effect whenever the messages array changes

  const sendMessage = () => {
    if (recipientId && message) {
      socket.emit("private_message", {
        recipientId,
        message,
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "You", text: message },
      ]);

      setMessage(""); // Clear input field
    }
  };

  const handleSelectUser = (user) => {
    setSelectUser(user);
    setRecipientId(user); // Automatically set recipientId to selected user
  };

  return (
    <>
      <div style={{ maxWidth: "400px", margin: "20px auto", padding: "10px" }}>
        <h2>Online Users</h2>
        <ul style={{ padding: 0, listStyleType: "none" }}>
          {users.map((user) => (
            <li
              key={user}
              onClick={() => handleSelectUser(user)}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "40px", height: "40px", backgroundColor: "#007BFF", borderRadius: "50%", marginRight: "10px",
                }}
              ></div>
              {user}
            </li>
          ))}
        </ul>
      </div>

      {selectUser && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            height: "500px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Chat with {selectUser}</h2>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              marginBottom: "10px",
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: msg.sender === "You" ? "row-reverse" : "row",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    backgroundColor: msg.sender === "You" ? "#007BFF" : "#ddd",
                    color: msg.sender === "You" ? "#fff" : "#000",
                    maxWidth: "70%",
                    wordWrap: "break-word",
                  }}
                >
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              </div>
            ))}

            {/* This div will make the view scroll to the bottom */}
            <div ref={messageEndRef} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
            }}
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                fontSize: "16px",
                marginRight: "10px",
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px",
                backgroundColor: "#007BFF",
                color: "#fff",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
