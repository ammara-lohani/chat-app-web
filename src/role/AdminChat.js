import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminChat() {
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatMessages, setSelectedChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuthAndFetchMessages();
  }, []);

  const checkAuthAndFetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
        alert('Access denied. Admin privileges required.');
        navigate('/admin/login');
        return;
      }

      if (!token) {
        alert('No authentication token found. Please login.');
        navigate('/admin/login');
        return;
      }

      await fetchAllMessages(token);
      
    } catch (err) {
      console.error('Authorization check failed:', err);
      setError('Authorization failed. Please login again.');
      navigate('/admin/login');
    }
  };

  const fetchAllMessages = async (token) => {
    try {
      const endpoint = `${process.env.REACT_APP_API_BASE_URL}/allmessages`;
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const messagesData = response.data;
      setAllMessages(messagesData);
      generateChatList(messagesData);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching messages:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized access. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
      } else {
        setError('Failed to fetch messages');
      }
      
      setLoading(false);
    }
  };

  const generateChatList = (messagesData) => {
    const chatMap = new Map();
    
    messagesData.forEach(message => {
      const senderId = message.sender?.id;
      const receiverId = message.receiver?.id;
      const senderName = message.sender?.name || 'Unknown User';
      const receiverName = message.receiver?.name || 'Unknown User';
      
      if (!senderId || !receiverId) return;
      
      // Create unique chat ID (smaller ID first for consistency)
      const chatId = senderId < receiverId 
        ? `${senderId}-${receiverId}` 
        : `${receiverId}-${senderId}`;
      
      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          id: chatId,
          chatId,
          user1: {
            id: senderId < receiverId ? senderId : receiverId,
            name: senderId < receiverId ? senderName : receiverName
          },
          user2: {
            id: senderId < receiverId ? receiverId : senderId,
            name: senderId < receiverId ? receiverName : senderName
          },
          lastMessage: message.messageText,
          lastMessageTime: message.sentAt,
          messageCount: 0,
          messages: []
        });
      }
      
      const chat = chatMap.get(chatId);
      chat.messageCount++;
      chat.messages.push(message);
      
      // Update last message if this message is more recent
      if (new Date(message.sentAt) > new Date(chat.lastMessageTime)) {
        chat.lastMessage = message.messageText;
        chat.lastMessageTime = message.sentAt;
      }
    });

    // Sort messages within each chat
    chatMap.forEach(chat => {
      chat.messages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    });

    const chats = Array.from(chatMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
    
    setChatList(chats);
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setSelectedChatMessages(chat.messages);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getChatName = (chat) => {
    return `${chat.user1.name} & ${chat.user2.name}`;
  };

  // Filter chats based on search term
  const filteredChats = chatList.filter(chat => 
    getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="chat-container">
        <div className="top-bar">
          <h2>Admin Dashboard</h2>
        </div>
        <div className="content">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            fontSize: '18px' 
          }}>
            Loading chats...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="top-bar">
          <h2>Admin Dashboard</h2>
        </div>
        <div className="content">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ color: '#ff0000', fontSize: '16px' }}>{error}</div>
            <button 
              onClick={() => navigate('/admin/login')}
              className="send-button"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Top bar */}
      <div className="top-bar">
        <h2>Admin Dashboard </h2>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      <div className="content">
        {/* Left side: search + chats */}
        <div className="sidebar">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="chat-list">
            {filteredChats.length ? (
              filteredChats.map(chat => (
                <div
                  key={chat.id}
                  className={`chat-list-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div>
                    {getChatName(chat)}
                  </div>
                  <small>{chat.lastMessage || 'No messages yet'}</small>
                  {chat.lastMessageTime && (
                    <small className="message-time">
                      {new Date(chat.lastMessageTime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })} • {chat.messageCount} messages
                    </small>
                  )}
                </div>
              ))
            ) : searchTerm ? (
              <div className="no-users-found">No chats found matching your search.</div>
            ) : (
              <div className="no-chats-yet">No chats available.</div>
            )}
          </div>
        </div>

        {/* Right side: active chat */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <h3>Chat between {getChatName(selectedChat)}</h3>
                <small>Total messages: {selectedChat.messageCount}</small>
              </div>

              <div className="chat-info-box">
                🔍 Admin View - Monitoring conversation between {selectedChat.user1.name} and {selectedChat.user2.name}
              </div>

              <div className="messages">
                {selectedChatMessages.length > 0 ? (
                  selectedChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        msg.sender?.id === selectedChat.user1.id ? 'received' : 'sent'
                      }`}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.8 }}>
                        {msg.sender?.name}
                      </div>
                      {msg.messageText}
                      <div className="message-time">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : 'Unknown time'}
                        <span style={{ marginLeft: '8px', fontSize: '10px' }}>
                          {msg.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No messages in this chat.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div>💬</div>
              <div>Select a chat to view messages</div>
              <small>Choose from the conversations to monitor messages between users</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminChat;