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
    <nav className="navbar">
      <span className="navbar-brand">Helpdesk</span>
      <div className="navbar-right">
        <span className="navbar-username">{session?.user.name}</span>
        <button className="btn-signout" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
