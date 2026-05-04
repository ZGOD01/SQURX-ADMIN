import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F7F7F9] overflow-hidden text-gray-900 font-sans selection:bg-gray-200 selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-64 transition-all lg:ml-72">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth custom-scrollbar relative">
          <div className="absolute top-0 left-0 h-[300px] w-full bg-gradient-to-b from-white -z-10"></div>
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
