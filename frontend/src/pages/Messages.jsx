import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user, socket, getAuthHeaders } = useAuth();
  const location = useLocation();

  const [inbox, setInbox] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // The selected user object
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  
  // Loading states
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Typing states
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // User search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef(null);

  // Load inbox summary on mount
  useEffect(() => {
    fetchInbox();
  }, []);

  // Handle location state triggers (e.g. click "Message" from profile/feed)
  useEffect(() => {
    if (location.state && location.state.startChatWith) {
      const contact = location.state.startChatWith;
      handleSelectChat(contact);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load chat messages when activeChat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
    }
  }, [activeChat]);

  // Subscribe to real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (activeChat && msg.sender === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchInbox();
    };

    const handleSentMessageConfirm = (msg) => {
      if (activeChat && msg.receiver === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchInbox();
    };

    const handleUserTypingStatus = (data) => {
      if (activeChat && data.senderId === activeChat._id) {
        setIsOtherUserTyping(data.isTyping);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('sent_message_confirm', handleSentMessageConfirm);
    socket.on('user_typing', handleUserTypingStatus);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('sent_message_confirm', handleSentMessageConfirm);
      socket.off('user_typing', handleUserTypingStatus);
    };
  }, [socket, activeChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  const fetchInbox = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/chat/inbox/summary', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setInbox(data);
      }
    } catch (err) {
      console.error('Error fetching inbox summary:', err);
    } finally {
      setLoadingInbox(false);
    }
  };

  const fetchMessages = async (contactId) => {
    setLoadingMessages(true);
    setIsOtherUserTyping(false);
    try {
      const res = await fetch(`http://localhost:5000/api/chat/${contactId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectChat = (selectedUser) => {
    setActiveChat(selectedUser);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Clear unread indicator locally
    setInbox(prevInbox => 
      prevInbox.map(item => 
        item.user._id === selectedUser._id ? { ...item, unread: false } : item
      )
    );
  };

  const handleSearchUsers = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);

    try {
      const res = await fetch(`http://localhost:5000/api/auth/users?search=${val}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleInputChange = (val) => {
    setNewMessageText(val);
    if (!socket || !activeChat) return;

    // Emit typing status: true
    socket.emit('typing', { senderId: user.id, receiverId: activeChat._id, isTyping: true });

    // Reset stop typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { senderId: user.id, receiverId: activeChat._id, isTyping: false });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChat) return;

    // Clear typing timeout and emit typing status: false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket) {
      socket.emit('typing', { senderId: user.id, receiverId: activeChat._id, isTyping: false });
    }

    const textToSend = newMessageText.trim();
    setNewMessageText('');

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          receiverId: activeChat._id,
          text: textToSend
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => {
          if (prev.some(m => m._id === data._id)) return prev;
          return [...prev, data];
        });
        fetchInbox();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="messages-container page-fade-in">
      {/* Sidebar inbox list */}
      <div className="inbox-list">
        <div className="inbox-header">
          <h2>Messages</h2>
        </div>
        <div className="search-users-bar">
          <input
            type="text"
            className="search-users-input"
            placeholder="Search users to chat..."
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
          />
        </div>

        <div className="chats-scrollable">
          {loadingInbox ? (
            // Shimmer Loading for Inbox
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="inbox-item" style={{ pointerEvents: 'none' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                <div className="inbox-item-details" style={{ gap: '8px' }}>
                  <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '140px', height: '10px', borderRadius: '4px' }} />
                </div>
              </div>
            ))
          ) : isSearching ? (
            searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                No users found.
              </div>
            ) : (
              searchResults.map((searchUser) => (
                <div 
                  key={searchUser._id} 
                  className="inbox-item"
                  onClick={() => handleSelectChat(searchUser)}
                >
                  <img src={searchUser.avatar} alt={searchUser.username} />
                  <div className="inbox-item-details">
                    <span className="inbox-item-username">{searchUser.username}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{searchUser.bio || 'No bio yet'}</span>
                  </div>
                </div>
              ))
            )
          ) : inbox.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: '13px' }}>
              No messages yet. Search users to start chatting!
            </div>
          ) : (
            inbox.map((inboxItem) => (
              <div 
                key={inboxItem.user?._id} 
                className={`inbox-item ${inboxItem.unread ? 'unread' : ''} ${activeChat?._id === inboxItem.user?._id ? 'active' : ''}`}
                onClick={() => handleSelectChat(inboxItem.user)}
              >
                <img src={inboxItem.user?.avatar} alt={inboxItem.user?.username} />
                <div className="inbox-item-details">
                  <div className="inbox-item-row">
                    <span className="inbox-item-username">{inboxItem.user?.username}</span>
                    <span className="inbox-item-time">{new Date(inboxItem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="inbox-item-row">
                    <span className="inbox-item-msg">{inboxItem.lastMessage}</span>
                    {inboxItem.unread && <div className="inbox-item-unread-dot" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat workspace */}
      <div className="chat-workspace">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <img src={activeChat.avatar} alt={activeChat.username} />
              <span className="chat-header-name">{activeChat.username}</span>
            </div>

            {/* Message history */}
            <div className="chat-messages-history">
              {loadingMessages ? (
                // Shimmer messages
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`msg-wrapper ${i % 2 === 0 ? 'sent' : 'received'}`}>
                    <div className="skeleton" style={{ width: '45%', height: '36px', borderRadius: '18px' }} />
                  </div>
                ))
              ) : (
                <>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                      Wave to {activeChat.username}! Say hello.
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isSentByMe = msg.sender === user?.id;

                    return (
                      <div key={msg._id} className={`msg-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
                        <div className="msg-bubble">
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator Bubble */}
                  {isOtherUserTyping && (
                    <div className="msg-wrapper received">
                      <div className="typing-indicator-chat">
                        <div className="typing-dot-chat" />
                        <div className="typing-dot-chat" />
                        <div className="typing-dot-chat" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chat-input-area">
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Message..."
                  value={newMessageText}
                  onChange={(e) => handleInputChange(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!newMessageText.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="chat-welcome">
            <div className="chat-welcome-circle">
              <Send size={44} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>Your Messages</h3>
            <p style={{ fontSize: '14px' }}>Send private photos and messages to a friend.</p>
          </div>
        )}
      </div>
    </div>
  );
}
