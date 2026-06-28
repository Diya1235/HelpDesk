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
        <button
          onClick={handleSignOut}
          className="text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded-md px-3.5 py-1.5 hover:bg-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
