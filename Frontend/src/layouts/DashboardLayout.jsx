import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
