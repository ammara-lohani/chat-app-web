import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from 'axios';

function UserChat() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

    const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }, []); 

  const [allUsers, setAllUsers] = useState([]); // All available users for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [chats, setChats] = useState([]); // [{ id: chatId, participants: [...], lastMessage, messages: [] }]
  const [activeChat, setActiveChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsLoaded, setChatsLoaded] = useState(false); // Flag to prevent re-loading
  const [userCache, setUserCache] = useState(new Map()); // Cache for user details
  const [loadedChatHistories, setLoadedChatHistories] = useState(new Set()); // Track which chats have full history loaded

  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(activeChat);
  const dropdownRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserDetails = useCallback(async (userId) => {
    if (userCache.has(userId)) {
      return userCache.get(userId);
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/details/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const userDetails = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email
      };
      
      // Update cache
      setUserCache(prev => new Map(prev.set(userId, userDetails)));
      return userDetails;
    } catch (error) {
      console.error(`Error fetching user details for ID ${userId}:`, error);
      return {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@unknown.com`
      };
    }
  }, [token, userCache]);

  // Function to load all users for dropdown
  const loadAllUsers = useCallback(async () => {
    if (allUsers.length > 0) return; // Already loaded

    try {
      setUsersLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/dropdown`, // Updated endpoint to get all users
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Filter out current user from the list
      const filteredUsers = response.data.filter(u => u.id !== user?.id);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading all users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, [token, user?.id, allUsers.length]);

  // Function to update chat with user details
  const updateChatWithUserDetails = useCallback(async (chat) => {
    const otherUserId = chat.participants.find(id => id !== user?.id);
    if (!otherUserId || chat.userDetailsLoaded) {
      return chat; // Already has details or no other user
    }

    try {
      const userDetails = await getUserDetails(otherUserId);
      return {
        ...chat,
        name: userDetails.name,
        receiverName: userDetails.name,
        receiverId: otherUserId,
        userDetailsLoaded: true
      };
    } catch (error) {
      console.error('Error updating chat with user details:', error);
      return {
        ...chat,
        name: `User ${otherUserId}`,
        receiverName: `User ${otherUserId}`,
        receiverId: otherUserId,
        userDetailsLoaded: true
      };
    }
  }, [getUserDetails, user?.id]);

  // Fix Issue 2: Function to load chat history
  const loadChatHistory = useCallback(async (chatId, receiverId) => {
    if (!user?.id || !receiverId || loadedChatHistories.has(chatId)) {
      return; 
    }

    try {
      console.log("Loading chat history for:", user.id, receiverId);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/messages/chat/${user.id}/${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the chat with full message history
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId
            ? { ...chat, messages: response.data }
            : chat
        )
      );

      // Update activeChat if it's the same chat
      if (activeChatRef.current?.id === chatId) {
        setActiveChat(prev => ({
          ...prev,
          messages: response.data
        }));
      }

      // Mark this chat history as loaded
      setLoadedChatHistories(prev => new Set(prev).add(chatId));
    } catch (error) {
      console.error("Chat history error:", error);
    }
  }, [user?.id, token]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat, chats]);

  // Load user's existing chats when component mounts
  useEffect(() => {
    if (!token || !user || chatsLoaded) {
      if (!token || !user) {
        navigate('/user/login');
      }
      return;
    }

    const loadUserChats = async () => {
      try {
        setChatsLoading(true);
        console.log("Loading chats for user:", user.id);
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/getting/${user.id}`, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Received chat data:", response.data);

        // Transform the latest messages into chat objects and deduplicate
        const chatMap = new Map();
        
        for (const message of response.data) {
          // Determine the other participant (chat partner)
          const otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
          const chatId = `${Math.min(user.id, otherUserId)}-${Math.max(user.id, otherUserId)}`;
          
          // Only add if this chat doesn't exist yet, or if this message is more recent
          const existingChat = chatMap.get(chatId);
          const messageTime = new Date(message.sentAt);
          
          if (!existingChat || new Date(existingChat.lastMessageTime) < messageTime) {
            chatMap.set(chatId, {
              id: chatId,
              participants: [user.id, otherUserId],
              messages: [], // Will be loaded when chat is selected or when new messages arrive
              lastMessage: message.messageText,
              receiverId: otherUserId,
              name: `User ${otherUserId}`, // Temporary name, will be updated
              receiverName: `User ${otherUserId}`, // Temporary name, will be updated
              lastMessageTime: message.sentAt,
              userDetailsLoaded: false
            });
          }
        }

        const transformedChats = Array.from(chatMap.values());
        console.log("Transformed chats:", transformedChats);
        
        // Update chats with user details
        const chatsWithDetails = await Promise.all(
          transformedChats.map(chat => updateChatWithUserDetails(chat))
        );
        
        setChats(chatsWithDetails);
        setChatsLoaded(true); // Mark as loaded
      } catch (error) {
        console.error("Error loading user chats:", error);
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
        // Don't show alert for 404 - user might not have any chats yet
        if (error.response?.status !== 404) {
          console.error("Failed to load chats. You can still start new conversations.");
        }
        setChatsLoaded(true); // Mark as loaded even on error to prevent retry loops
      } finally {
        setChatsLoading(false);
      }
    };

    loadUserChats();
  }, [token, user?.id, navigate, chatsLoaded, updateChatWithUserDetails]); // Use user.id instead of entire user object

  // Load chat history when selecting a chat
  useEffect(() => {
    if (activeChat && activeChat.receiverId) {
      loadChatHistory(activeChat.id, activeChat.receiverId);
    }
  }, [activeChat?.id, loadChatHistory]);

  useEffect(() => {
    if (!token || !user) {
      navigate('/user/login');
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.REACT_APP_API_BASE_URL}/ws`),
      connectHeaders: {
        Authorization: "Bearer " + token,
      },
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");

        // Subscribe to all chat messages
        client.subscribe("/topic/message", async (message) => {
          const receivedMessage = JSON.parse(message.body);
          if (receivedMessage.senderId === user.id) {
            return;
          }
          console.log("Received message:", receivedMessage);
           
          client.subscribe("/queue/messages", (msg) => {
            const privateMessage = JSON.parse(msg.body);
            console.log("Received private message:", privateMessage);
          });

          // Get sender details for the received message
          const senderDetails = await getUserDetails(receivedMessage.senderId);

          // Create chat ID from sender and receiver IDs
          const chatId = `${Math.min(receivedMessage.senderId, receivedMessage.receiverId)}-${Math.max(receivedMessage.senderId, receivedMessage.receiverId)}`;

          // Update chats with the incoming message
          setChats((prevChats) => {
            let chat = prevChats.find(c => c.id === chatId);

            if (chat) {
              // Add message to existing chat
              const updatedChat = {
                ...chat,
                messages: [...(chat.messages || []), receivedMessage],
                lastMessage: receivedMessage.messageText,
                lastMessageTime: receivedMessage.sentAt
              };

              return prevChats.map(c => c.id === chat.id ? updatedChat : c);
            } else {
              // Create new chat from message - fix the receiverId logic
              const otherUserId = receivedMessage.senderId === user.id ? 
                receivedMessage.receiverId : receivedMessage.senderId;
              
              const newChat = {
                id: chatId,
                participants: [receivedMessage.senderId, receivedMessage.receiverId],
                messages: [receivedMessage],
                lastMessage: receivedMessage.messageText,
                receiverId: otherUserId, // The person we're chatting with
                name: senderDetails.name, // Use actual name from API
                receiverName: senderDetails.name, // Add receiverName property
                lastMessageTime: receivedMessage.sentAt,
                userDetailsLoaded: true
              };
              
              // Double-check that this chat doesn't already exist before adding
              const existsAlready = prevChats.some(c => c.id === chatId);
              return existsAlready ? prevChats : [...prevChats, newChat];
            }
          });

          // Fix Issue 1: Use activeChatRef.current instead of activeChat to get latest value
          const currentActiveChat = activeChatRef.current;
          
          // Auto-set activeChat if message belongs to it
          if (currentActiveChat && (
            (receivedMessage.senderId === user.id && receivedMessage.receiverId === currentActiveChat.receiverId) ||
            (receivedMessage.receiverId === user.id && receivedMessage.senderId === currentActiveChat.receiverId)
          )) {
            setActiveChat((prev) => {
              return {
                ...prev,
                messages: [...(prev.messages || []), receivedMessage],
                lastMessage: receivedMessage.messageText,
                lastMessageTime: receivedMessage.sentAt
              };
            });
          }

          // Fix Issue 2: Load chat history if this is a new message and history isn't loaded yet
          if (!loadedChatHistories.has(chatId)) {
            const receiverId = receivedMessage.senderId === user.id ? 
              receivedMessage.receiverId : receivedMessage.senderId;
            loadChatHistory(chatId, receiverId);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker error: " + frame.headers["message"]);
        console.error("Details: " + frame.body);
      },
      onDisconnect: () => {
        console.log("Disconnected from STOMP");
      }
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [token, user?.id, navigate, getUserDetails, loadChatHistory, loadedChatHistories]); // Add dependencies

  // Send message - Updated with better validation
  const sendMessage = () => {
    console.log("Active chat:", activeChat);
    console.log("Receiver ID:", activeChat?.receiverId);
    console.log("User ID:", user.id);
    console.log("Full activeChat object:", JSON.stringify(activeChat, null, 2));

    // Validate required data
    if (!messageInput.trim()) {
      console.log("Empty message input");
      return;
    }

    if (!activeChat) {
      console.log("No active chat selected");
      alert("Please select a chat first");
      return;
    }

    if (!activeChat.receiverId) {
      console.error("No receiver ID found in activeChat!");
      alert("Error: No receiver selected. Please select a chat first.");
      return;
    }

    if (!stompClientRef.current?.connected) {
      console.log("WebSocket not connected");
      alert("Connection lost. Please refresh the page.");
      return;
    }

    const message = {
      senderId: user.id,
      receiverId: activeChat.receiverId,
      messageText: messageInput.trim(),
      sentAt: new Date().toISOString(),
    };

    console.log("Sending message:", message);

    try {
      stompClientRef.current.publish({
        destination: "/app/sendMessage",
        body: JSON.stringify(message),
      });

      // Optimistic update
      setActiveChat((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), message],
        lastMessage: message.messageText,
        lastMessageTime: message.sentAt
      }));

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat.id
            ? { 
                ...chat, 
                lastMessage: message.messageText, 
                messages: [...(chat.messages || []), message],
                lastMessageTime: message.sentAt
              }
            : chat
        )
      );

      setMessageInput('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Get chat partner name or fallback label
  const getChatPartner = (chat) => {
    return chat.name && chat.name !== `User ${chat.receiverId}` ? chat.name : `User ${chat.receiverId}`;
  };

  // Handle selecting chat - Updated to ensure receiverId is set and fetch user details
  const selectChat = async (chat) => {
    console.log("Selecting chat:", chat);
    
    // Ensure receiverId is properly set when selecting existing chats
    const otherUserId = chat.participants.find(id => id !== user.id);
    
    let updatedChat = {
      ...chat,
      receiverId: chat.receiverId || otherUserId, // Use existing or calculate
      receiverName: chat.receiverName || chat.name // Ensure receiverName is set
    };

    // If we don't have proper user details, fetch them
    if (!chat.userDetailsLoaded && otherUserId) {
      updatedChat = await updateChatWithUserDetails(updatedChat);
      
      // Update the chat in the chats array with proper user details
      setChats(prevChats =>
        prevChats.map(c => c.id === chat.id ? updatedChat : c)
      );
    }
    
    console.log("Updated chat with receiverId:", updatedChat);
    setActiveChat(updatedChat);
  };

  // Handle starting new chat from dropdown selection
  const startChatWithUser = (selectedUser) => {
    console.log("Starting chat with user:", selectedUser);
    
    // Check if chat already exists
    const existingChatId = `${Math.min(user.id, selectedUser.id)}-${Math.max(user.id, selectedUser.id)}`;
    const existingChat = chats.find(chat => chat.id === existingChatId);
    
    if (existingChat) {
      selectChat(existingChat);
    } else {
      // Create a new direct messaging chat
      const directChat = {
        id: existingChatId,
        participants: [user.id, selectedUser.id],
        messages: [],
        name: selectedUser.name, // Use actual name from dropdown
        receiverName: selectedUser.name, // Add receiverName property
        receiverId: selectedUser.id,
        lastMessage: null,
        lastMessageTime: null,
        userDetailsLoaded: true
      };
      
      console.log("Created new chat:", directChat);
      setActiveChat(directChat);
      setChats(prev => {
        // Check if chat already exists in the array (race condition protection)
        const exists = prev.find(chat => chat.id === existingChatId);
        return exists ? prev : [...prev, directChat];
      });
    }
    
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    if (!isDropdownOpen) {
      loadAllUsers(); // Load users when opening dropdown
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Sort chats by last message time (most recent first)
  const sortedChats = [...chats].sort((a, b) => {
    if (!a.lastMessageTime && !b.lastMessageTime) return 0;
    if (!a.lastMessageTime) return 1;
    if (!b.lastMessageTime) return -1;
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
  });

  return (
    <div className="chat-container">
      {/* Top bar */}
      <div className="top-bar">
        <h2>My Chats</h2>
        <button onClick={logout} className="logout-button">Logout</button>
      </div>

      <div className="content">
        {/* Left side: dropdown + chats */}
        <div className="sidebar">
          {/* User Dropdown */}
          <div className="dropdown-container" ref={dropdownRef}>
            <button
              className="dropdown-toggle"
              onClick={handleDropdownToggle}
              disabled={usersLoading}
            >
              {usersLoading ? 'Loading users...' : 'Start new chat ▼'}
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {allUsers.length > 0 ? (
                  allUsers.map(user => (
                    <div
                      key={user.id}
                      className="dropdown-item"
                      onClick={() => startChatWithUser(user)}
                      title={user.name} // Tooltip showing name on hover
                    >
                      <div className="user-email">{user.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item disabled">
                    {usersLoading ? 'Loading...' : 'No users available'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="chat-list">
            {chatsLoading ? (
              <div className="loading-chats">
                <div>Loading your chats...</div>
              </div>
            ) : sortedChats.length ? (
              sortedChats.map(chat => {
                return (
                  <div
                    key={chat.id}
                    className={`chat-list-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                    onClick={() => selectChat(chat)}
                  >
                    <div className="chat-partner-name">
                      {chat.name && chat.userDetailsLoaded ? chat.name : `User ${chat.receiverId}`}
                    </div>
                    <small className="last-message">
                      {chat.lastMessage || 'No messages yet'}
                    </small>
                    {chat.lastMessageTime && (
                      <small className="message-time">
                        {new Date(chat.lastMessageTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </small>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-chats-yet">No chats yet. Use the dropdown above to start chatting!</div>
            )}
          </div>
        </div>

        {/* Right side: active chat */}
        <div className="chat-window">
          {activeChat ? (
            <>
              <div className="chat-header">
                <h3>
                  Chat with {activeChat.userDetailsLoaded && activeChat.name ? 
                    activeChat.name : 
                    `User ${activeChat.receiverId}`
                  }
                </h3>
              </div>

              <div className="chat-info-box encrypted">
                🔒 Messages are end-to-end encrypted. Only you and {
                  activeChat.userDetailsLoaded && activeChat.name ? 
                    activeChat.name : 
                    `User ${activeChat.receiverId}`
                } can read them.
              </div>

              <div className="messages">
                {(activeChat.messages && activeChat.messages.length > 0) ? (
                  activeChat.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}
                    >
                      {msg.messageText}
                      <div className="message-time">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'Sending...'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="message-input"
                />
                <button
                  onClick={sendMessage}
                  className="send-button"
                  disabled={!messageInput.trim() || !activeChat?.receiverId}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div>💬</div>
              <div>Select a chat to start messaging</div>
              <small>Choose from your existing conversations or start a new chat using the dropdown above</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserChat;