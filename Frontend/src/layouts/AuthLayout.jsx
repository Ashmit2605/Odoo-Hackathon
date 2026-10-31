import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#FAF7F0]">
      <Outlet />
    </main>
  );
}
