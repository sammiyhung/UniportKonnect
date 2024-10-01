import { useLocation, Outlet } from "react-router-dom";

import Topbar from "@/components/shared/Topbar";
import Bottombar from "@/components/shared/Bottombar";
import LeftSidebar from "@/components/shared/LeftSidebar";

const RootLayout = () => {
  const location = useLocation();
  return (
    <div className="w-full md:flex">
      {!location.pathname.includes('/chat') && (
          <Topbar />
      )}
      <LeftSidebar />

      <section className="flex flex-1 h-full">
        <Outlet />
      </section>

      {!location.pathname.includes('/chat') && (
          <Bottombar />
      )}
    </div>
  );
};

export default RootLayout;
