import { useState, useEffect } from "react";
import "./app.css";

interface HealthResponse {
  status: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => setHealth(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Helpdesk</h1>

      {loading && <p style={{ color: "#6b7280" }}>Checking server status...</p>}

      {!loading && health && (
        <p style={{ color: "#16a34a" }}>
          Server is <strong>online</strong> — status: {health.status}
        </p>
      )}

      {!loading && error && (
        <p style={{ color: "#dc2626" }}>
          Server is <strong>offline</strong> — {error}
        </p>
      )}
    </div>
  );
}
