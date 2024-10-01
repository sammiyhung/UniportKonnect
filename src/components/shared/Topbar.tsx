import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/AuthContext";
import { useSignOutAccount } from "@/lib/react-query/queries";

const Topbar = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { user } = useUserContext();
  const { mutate: signOut, isSuccess } = useSignOutAccount();

  useEffect(() => {
    if (isSuccess) navigate(0);
  }, [isSuccess]);

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.png"
            alt="logo"
            width={130}
            height={325}
          />
        </Link>


        <div className="flex gap-1">
               {/* Notifications Button */}
          <button 
            className="p-2 rounded-full hover:bg-gray-800 focus:outline-none relative"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A9.965 9.965 0 0019 11V8a7 7 0 00-14 0v3a9.965 9.965 0 00.405 4.595L4 17h5m0 0v1a3 3 0 106 0v-1m-6 0h6" />
            </svg>
            {/* Notifications Overlay */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50">
                <div className="p-4">
                    <p className="text-black-700">No notifications yet.</p>
                </div>
              </div>
            )}
          </button>

          {/* Help Button */}
          <button 
            className="p-2 hover:bg-gray-800 focus:outline-none relative rounded-full"
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
          <Button
            variant="ghost"
            className="shad-button_ghost"
            onClick={() => signOut()}>
            <img src="/assets/icons/logout.svg" alt="logout" />
          </Button>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;
