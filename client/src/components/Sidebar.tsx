import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">
          <span className="text-primary">Invoice</span>Generator
        </h1>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <Link href="/">
          <a
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === "/"
                ? "text-white bg-primary"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </a>
        </Link>
        <Link href="/invoices">
          <a
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location.startsWith("/invoices")
                ? "text-white bg-primary"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Invoices
          </a>
        </Link>
        <Link href="/clients">
          <a
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === "/clients"
                ? "text-white bg-primary"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Clients
          </a>
        </Link>
        <Link href="/settings">
          <a
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === "/settings"
                ? "text-white bg-primary"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </a>
        </Link>
        <Link href="/subscription">
          <a
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location === "/subscription"
                ? "text-white bg-primary"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Subscription
          </a>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.username || "Loading..."}
            </p>
            <p className="text-xs font-medium text-gray-500">Freelancer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
