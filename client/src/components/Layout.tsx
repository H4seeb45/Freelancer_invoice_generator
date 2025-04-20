import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "../hooks/use-auth";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (desktop only) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top nav for mobile */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <button
                type="button"
                className="text-gray-500 md:hidden focus:outline-none"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="ml-2 text-lg font-medium text-gray-800 md:hidden">
                <span className="text-primary">Invoice</span>Generator
              </h1>
            </div>
            <div className="flex items-center">
              <div className="hidden md:flex items-center mr-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.username || ""}
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 text-gray-500 rounded-full hover:text-red-500 focus:outline-none flex items-center"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline ml-2 text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {children}
        </main>

        {/* Mobile bottom navigation (mobile only) */}
        <MobileNav />
      </div>
    </div>
  );
}
