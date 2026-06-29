import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { Headphones, Sun, Moon, Ticket, Users } from "lucide-react";
import { useTheme } from "../lib/theme";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 bg-background border-b border-border shadow-sm h-14 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground tracking-tight">
          <Headphones className="h-5 w-5 text-primary" />
          Helpdesk
        </Link>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Ticket className="h-4 w-4" />
          Tickets
        </Link>
        {isAdmin && (
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          {session?.user.name}
        </span>
        {session?.user && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            isAdmin
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {isAdmin ? "admin" : "agent"}
          </span>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm bg-primary text-primary-foreground rounded-md px-3.5 py-1.5 hover:opacity-90 transition-opacity cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
