import { Navbar } from "../components/Navbar";

export function HomePage() {
  return (
    <div className="app">
      <Navbar />
      <main className="dashboard">
        <h1>Dashboard</h1>
        <p>Welcome to Helpdesk. Ticket management coming soon.</p>
      </main>
    </div>
  );
}
