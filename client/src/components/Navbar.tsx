import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm h-14 flex items-center justify-between px-6">
      <span className="text-lg font-bold text-blue-600 tracking-tight">
        Helpdesk
      </span>
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
