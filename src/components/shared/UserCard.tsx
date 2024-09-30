import { Models } from 'appwrite';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

import { Button } from '../ui/button'; // Assuming you have a Button component

type UserCardProps = {
  user: Models.Document;
};

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate(); // Initialize useNavigate for programmatic navigation

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
