import { useEffect, useState } from 'react';
import { Models } from 'appwrite';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { getCurrentUser } from '@/lib/appwrite/api'; // Assuming you're using an API call to get the current user
import { Button } from '../ui/button'; // Assuming you have a Button component

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate for programmatic navigation

  // Fetch current user ID
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

  return (
    <div className="user-card flex flex-col items-center justify-center p-4 border rounded-lg shadow-md">
      {/* Profile Link */}
      <Link to={`/profile/${user.$id}`} className="flex flex-col items-center justify-center">
        <img
          src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
          alt="user-profile"
          className="rounded-full w-14 h-14"
        />
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="base-medium text-light-1 text-center line-clamp-1">{user.name}</p>
          <p className="small-regular text-light-3 text-center line-clamp-1">@{user.username}</p>
        </div>
      </Link>

      {/* Chat Button */}
      <Button
        type="button"
        size="sm"
        className="shad-button_primary px-5 mt-3"
        onClick={() => navigate(`/chat/${user.$id}`)} // Use navigate to programmatically navigate
      >
        Chat
      </Button>
    </div>
  );
};

export default UserCard;
