import { Client, Databases, Query } from 'appwrite';

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL) // Appwrite endpoint
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); // Appwrite project ID

const databases = new Databases(client);

// Function to send a message
const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  try {
    const message = await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,  // Database ID
      import.meta.env.VITE_APPWRITE_CHAT_COLLECTION_ID,  // Messages collection ID
      'unique()',  // Auto-generate unique ID
      { senderId, receiverId, content, timestamp: new Date() }, // Message details
    );
    console.log('Message sent successfully:', message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to fetch messages between two users
const fetchMessages = async (currentUserId: string, chatPartnerId: string) => {
  try {
    // Fetch messages sent by currentUser to chatPartner
    const sentMessages = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_CHAT_COLLECTION_ID,
      [
        Query.equal('senderId', [currentUserId]),
        Query.equal('receiverId', [chatPartnerId]),
      ]
    );

    // Fetch messages sent by chatPartner to currentUser
    const receivedMessages = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_CHAT_COLLECTION_ID,
      [
        Query.equal('senderId', [chatPartnerId]),
        Query.equal('receiverId', [currentUserId]),
      ]
    );

    // Combine and sort messages by timestamp
    const allMessages = [...sentMessages.documents, ...receivedMessages.documents];
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return allMessages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};


// Function to fetch chat partner's details by user ID
const getChatPartner = async (userId: string) => {
  try {
    const response = await databases.getDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,  // Database ID
      import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,  // Users collection ID
      userId  // Chat partner's ID
    );
    return response; // Return the chat partner's details (name, username, imageUrl, etc.)
  } catch (error) {
    console.error('Error fetching chat partner details:', error);
    return null;
  }
};

export { sendMessage, fetchMessages, getChatPartner };