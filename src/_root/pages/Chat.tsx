// Chat.tsx
import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { sendMessage as sendMessageToAppwrite, fetchMessages, getChatPartner } from './ChatService'; 
import { getCurrentUser } from '@/lib/appwrite/api';
import { Models } from 'appwrite';
import io, { Socket } from 'socket.io-client'; // Socket.io client
import TypingIndicator from './TypingIndicator'; // Typing indicator component


const SOCKET_SERVER_URL = import.meta.env.REACT_APP_SOCKET_SERVER_URL || 'https://uniportkonnect-server.onrender.com'; // Your Socket.io server URL

const Chat = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<Models.Document | null>(null);
  const [isTyping, setIsTyping] = useState(false); // State to track typing status
  const socketRef = useRef<Socket | null>(null); // Ref to store socket instance
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for typing timeout
  
  // States for Search Functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // States for Overlays
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Ref for last message and message end
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLButtonElement | null>(null);
  
  // Ref to track scroll position
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize Socket.io client
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // Specify transports if needed
    });

    // Once socket is connected, emit 'join' event with currentUserId
    if (currentUserId) {
      socketRef.current.emit('join', currentUserId);
    }

    // Listen for incoming messages
    socketRef.current.on('receiveMessage', (messageData: any) => {
      setMessages((prevMessages) => [...prevMessages, {
        senderId: messageData.senderId,
        content: messageData.message,
        timestamp: messageData.timestamp,
        $id: `msg-${Date.now()}`, // Generate a unique ID or use server-generated IDs
      }]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socketRef.current.on('typing', ({ senderId }: { senderId: string }) => {
      if (senderId !== currentUserId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000); // Hide after 3 seconds
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, SOCKET_SERVER_URL]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser.$id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchChatPartnerDetails = async () => {
      if (userId) {
        try {
          const partnerData = await getChatPartner(userId);
          setChatPartner(partnerData);
        } catch (error) {
          console.error('Error fetching chat partner:', error);
        }
      }
    };
    fetchChatPartnerDetails();
  }, [userId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (currentUserId && userId) {
        const messages = await fetchMessages(currentUserId, userId);
        setMessages(messages);
        scrollToBottom();
      }
    };
    loadMessages();
  }, [currentUserId, userId]);

  useEffect(() => {
    // Scroll to bottom on message updates
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom on page load
    scrollToBottom();
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim() && currentUserId && userId) {
      const messageContent = newMessage.trim();
      const timestamp = new Date().toISOString();

      try {
        // 1. Emit the message via Socket.io
        socketRef.current?.emit('sendMessage', {
          senderId: currentUserId,
          receiverId: userId,
          message: messageContent,
        });

        // 2. Send the message to Appwrite for persistence
        await sendMessageToAppwrite(currentUserId, userId, messageContent);

        // Optionally, add the message to local state immediately
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            senderId: currentUserId,
            content: messageContent,
            timestamp: timestamp,
            $id: `msg-${Date.now()}`, // Generate a unique ID or use server-generated IDs
          },
        ]);

        setNewMessage('');
        scrollToBottom();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socketRef.current && currentUserId && userId) {
      socketRef.current.emit('typing', {
        senderId: currentUserId,
        receiverId: userId,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set a timeout to reset typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };




  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Search Functionality
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    const results = messages
      .map((msg, index) => msg.content.toLowerCase().includes(query.toLowerCase()) ? index : -1)
      .filter(index => index !== -1);
    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex]);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex]);
  };

  const scrollToMessage = (index: number) => {
    const messageElement = document.getElementById(`message-${index}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle Scroll to Show/Hide Down Arrow
  const handleScroll = () => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      if (scrollTop + clientHeight < scrollHeight - 50) { // Threshold of 50px
        if (lastMessageRef.current) {
          lastMessageRef.current.style.display = 'block';
        }
      } else {
        if (lastMessageRef.current) {
          lastMessageRef.current.style.display = 'none';
        }
      }
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Render Highlighted Message Content
  const renderMessageContent = (content: string) => {
    if (!searchQuery) return content;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = content.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="bg-yellow-200">{part}</span> : part
    );
  };

  return (
    <div className="chat-page-container h-full flex flex-col justify-between w-full sm:overflow-x-hidden sm:overflow-y-hidden">
      {/* Header/Top Bar */}
      <div className="chat-header bg-gray-900 flex items-center justify-between p-2 shadow-md relative">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="back-button mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link to={`/profile/${chatPartner?.$id}`} className="flex items-center">
            <img src={chatPartner?.imageUrl || '/assets/icons/profile-placeholder.svg'} alt="Avatar" className="h-10 w-10 rounded-full mr-2" />
            <div>
              <p className="font-bold text-md text-white">{chatPartner?.name || 'Loading...'}</p>
              <p className="text-sm text-gray-400">@{chatPartner?.username || 'Loading...'}</p>
            </div>
          </Link>
        </div>

        {/* Search and Icon Buttons */}
        <div className="flex items-center gap-1">
          {/* Search Bar for Large Screens */}
          <div className="hidden lg:flex relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search Chat"
              className="px-1 py-1 text-white rounded-md border border-gray-300 focus:outline-none focus:bg-gray-800 bg-gray-700"
            />
            {searchQuery && (
              <div className="absolute right-10 top-1 flex flex-col">
                <button onClick={goToPrevResult} className="bg-gray-600 text-white p-1 rounded mb-1">
                  ↑
                </button>
                <button onClick={goToNextResult} className="bg-gray-600 text-white p-1 rounded">
                  ↓
                </button>
              </div>
            )}
          </div>

          {/* Search Button for Small Screens */}
          <button 
            className="lg:hidden p-1 rounded-full hover:bg-gray-800 focus:outline-none"
            onClick={() => setIsSearchActive(!isSearchActive)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="gray">
              <path d="M23.111 20.058l-4.977-4.977c.965-1.52 1.523-3.322 1.523-5.251 0-5.42-4.409-9.83-9.829-9.83-5.42 0-9.828 4.41-9.828 9.83s4.408 9.83 9.829 9.83c1.834 0 3.552-.505 5.022-1.383l5.021 5.021c2.144 2.141 5.384-1.096 3.239-3.24zm-20.064-10.228c0-3.739 3.043-6.782 6.782-6.782s6.782 3.042 6.782 6.782-3.043 6.782-6.782 6.782-6.782-3.043-6.782-6.782zm2.01-1.764c1.984-4.599 8.664-4.066 9.922.749-2.534-2.974-6.993-3.294-9.922-.749z"/>
            </svg>
          </button>

          {/* Search Overlay for Small Screens */}
          {isSearchActive && (
            <div className="absolute top-16 left-0 w-full bg-gray-800 p-4 z-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search Chat"
                  className="w-full p-2 text-white bg-gray-700 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-700"
                />
                <button onClick={() => setIsSearchActive(false)} className="text-white">
                  ✕
                </button>
              </div>
              {searchQuery && (
                <div className="flex justify-end mt-2">
                  <button onClick={goToPrevResult} className="bg-gray-600 text-white p-1 rounded mr-2">
                    ↑
                  </button>
                  <button onClick={goToNextResult} className="bg-gray-600 text-white p-1 rounded">
                    ↓
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications Button */}
          <button 
            className="p-2 rounded-full hover:bg-gray-800 focus:outline-none relative hidden md:block"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A9.965 9.965 0 0019 11V8a7 7 0 00-14 0v3a9.965 9.965 0 00.405 4.595L4 17h5m0 0v1a3 3 0 106 0v-1m-6 0h6" />
            </svg>
            {/* Notifications Overlay */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                <div className="p-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-700">No notifications yet.</p>
                  ) : (
                    <ul>
                      {/* Example Notification Items */}
                      <li className="py-2 border-b">New message from {chatPartner?.name}</li>
                      {/* Add more notifications as needed */}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </button>

          {/* Help Button */}
          <button 
            className="p-2 hover:bg-gray-800 focus:outline-none relative rounded-full hidden md:block"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="gray">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 18.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25c.691 0 1.25.56 1.25 1.25s-.559 1.25-1.25 1.25zm1.961-5.928c-.904.975-.947 1.514-.935 2.178h-2.005c-.007-1.475.02-2.125 1.431-3.468.573-.544 1.025-.975.962-1.821-.058-.805-.73-1.226-1.365-1.226-.709 0-1.538.527-1.538 2.013h-2.01c0-2.4 1.409-3.95 3.59-3.95 1.036 0 1.942.339 2.55.955.57.578.865 1.372.854 2.298-.016 1.383-.857 2.291-1.534 3.021z"/>
            </svg>
            {/* Help Overlay */}
            {isHelpOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Help & Navigation</h3>
                <p className="text-gray-700 text-sm">
                  - Use the search bar to find messages.<br/>
                  - Click on notifications to view updates.<br/>
                  - Access settings to customize your experience.<br/>
                  {/* Add more help content as needed */}
                </p>
              </div>
            )}
          </button>

          {/* Settings Button */}
          <button 
            className="p-2 rounded-full hover:bg-gray-800 focus:outline-none relative"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-6 w-6 text-gray-400" fill="gray">
              <path d="M19 18c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2zm-14-3c-1.654 0-3 1.346-3 3s1.346 3 3 3h14c1.654 0 3-1.346 3-3s-1.346-3-3-3h-14zm19 3c0 2.761-2.239 5-5 5h-14c-2.761 0-5-2.239-5-5s2.239-5 5-5h14c2.761 0 5 2.239 5 5zm0-12c0 2.761-2.239 5-5 5h-14c-2.761 0-5-2.239-5-5s2.239-5 5-5h14c2.761 0 5 2.239 5 5zm-15 0c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2z"/>
            </svg>
            {/* Settings Overlay */}
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Settings</h3>
                <ul className="text-gray-700 text-sm">
                  <li className="py-1">Change Theme</li>
                  <li className="py-1">Notification Preferences</li>
                  <li className="py-1">Privacy Settings</li>
                  {/* Add more settings as needed */}
                </ul>
              </div>
            )}
          </button>
        </div>

        {/* Notifications and Help Overlays Handling Outside Buttons */}
        {/* (Optional: To close overlays when clicking outside) */}
        {/* You can implement this using additional logic if required */}

      </div>

      {/* Message display */}
      <div 
        className="messages-container flex-grow overflow-y-auto p-4"
        ref={messagesContainerRef}
      >
        {messages.map((message, index) => (
          <div 
            id={`message-${index}`} 
            key={message.$id} 
            className={`message-item m-2 ${message.senderId === currentUserId ? 'text-right' : 'text-left'}`}
          >
            <div className={`inline-block px-4 py-2 rounded-lg ${message.senderId === currentUserId ? 'bg-pink-500 text-white max-w-md' : 'bg-gray-200 text-gray-800 max-w-md'}`}>
              <p>{renderMessageContent(message.content)}</p>
            </div>
            <small className="block text-xs text-gray-500 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
        {/* Typing Indicator */}
        {isTyping && (
          <div className="message-item m-2 text-left">
            <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800 max-w-md">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <button 
        ref={lastMessageRef}
        className="fixed bottom-[5rem] right-1/2 translate-x-1/2 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
        onClick={scrollToBottom}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M11.998 2c5.517 0 9.997 4.48 9.997 9.998 0 5.517-4.48 9.997-9.997 9.997-5.518 0-9.998-4.48-9.998-9.997 0-5.518 4.48-9.998 9.998-9.998zm4.843 8.211c.108-.141.157-.3.157-.456 0-.389-.306-.755-.749-.755h-8.501c-.445 0-.75.367-.75.755 0 .157.05.316.159.457 1.203 1.554 3.252 4.199 4.258 5.498.142.184.36.29.592.29.23 0 .449-.107.591-.291z"/>
        </svg>
      </button>


      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="message-input-form p-4 bg-gray-900 flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange} // Use the new handler
          placeholder="Type your message..."
          className="message-input w-full p-2 text-white bg-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-700"
        />
        <button
          type="submit"
          className="ml-4 bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-white-400" fill="white">
            <path d="M24 0l-6 22-8.129-7.239 7.802-8.234-10.458 7.227-7.215-1.754 24-12zm-15 16.668v7.332l3.258-4.431-3.258-2.901z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;