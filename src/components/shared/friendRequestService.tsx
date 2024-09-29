import { Client, Databases } from 'appwrite';

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL) // Appwrite endpoint
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); // Appwrite project ID

const databases = new Databases(client);

export const checkFriendRequestStatus = async (senderId: string, receiverId: string) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_FRIEND_REQUESTS_COLLECTION_ID,
      [`senderId=${senderId}`, `receiverId=${receiverId}`, `status=pending`]
    );

    const requestExists = response.documents.length > 0;
    console.log(`Friend request status between sender (${senderId}) and receiver (${receiverId}): ${requestExists ? 'Pending' : 'None'}`);

    return requestExists; // Return true if request exists
  } catch (error) {
    console.error('Error checking friend request status', error);
    return false; // Assume no request if error occurs
  }
};


export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  try {

    console.log("Sender ID:", senderId);
    console.log("Receiver ID:", receiverId);

    const result = await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID, // Replace with actual database ID
      import.meta.env.VITE_APPWRITE_FRIEND_REQUESTS_COLLECTION_ID, // Replace with actual collection ID
      'unique()', // Unique ID generated automatically by Appwrite
      {
        senderId,     // Make sure these fields exist in your collection schema
        receiverId,
        status: 'pending',
        createdAt: new Date().toISOString(), // Store the date as an ISO string
      }
    );
    console.log('Friend request sent', result);
  } catch (error) {
    console.error('Error sending friend request', error);
  }
};
// Function to cancel a friend request
export const cancelFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_FRIEND_REQUESTS_COLLECTION_ID,
      [
        `senderId=${senderId}`,
        `receiverId=${receiverId}`,
        `status=pending`
      ]
    );

    if (response.documents.length > 0) {
      const requestId = response.documents[0].$id;
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_FRIEND_REQUESTS_COLLECTION_ID,
        requestId
      );
      return true;  // Return true if the deletion was successful
    }
    return false;
  } catch (error) {
    console.error('Error canceling friend request', error);
    return false;  // Return false if there's an error
  }
};
