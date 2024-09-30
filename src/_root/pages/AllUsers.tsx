import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader, UserCard } from "@/components/shared";
import { useGetUsers } from "@/lib/react-query/queries";

const AllUsers = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  const { data: creators, isLoading, isError: isErrorCreators } = useGetUsers();

  // Show error if the query fails
  if (isErrorCreators) {
    toast({ title: "Something went wrong." });
    return;
  }

  // Filter the users based on the search query
  const filteredUsers = creators?.documents?.filter((creator) =>
    creator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    creator?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="common-container">
      <div className="user-container">
        {/* Header Section with Buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="h3-bold md:h2-bold text-left w-full">Find Students</h2>
        </div>

        {/* Search Bar */}
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by Username or Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query on change
            className="w-full px-4 py-2 border rounded-lg text-black"
          />
        </div>

        {/* Show loader while fetching data */}
        {isLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="user-grid">
            {/* Display filtered users */}
            {filteredUsers?.length > 0 ? (
              filteredUsers.map((creator) => (
                <li key={creator?.$id} className="flex-1 min-w-[200px] w-full">
                  <UserCard user={creator} />
                </li>
              ))
            ) : (
              <p>No users found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
