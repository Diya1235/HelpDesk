import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 bg-background border-b border-border shadow-sm h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-bold text-gray-850 tracking-tight">
          Helpdesk
        </Link>
        <Link
          to="/tickets"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Tickets
        </Link>
        {isAdmin && (
          <Link
            to="/users"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">

        <span className="text-sm font-medium text-gray-500">
          {session?.user.name}
        </span>
        {session?.user && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            isAdmin ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"
          }`}>
            {isAdmin ? "admin" : "agent"}
          </span>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm bg-gray-800 text-white border border-gray-700 rounded-md px-3.5 py-1.5 hover:bg-gray-900 hover:border-gray-800 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
