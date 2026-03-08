const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getRecentTransactions(limit = 30) {
  const res = await fetch(`${API_BASE}/transactions/recent?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export function createTransactionsSocket(onMessage) {
  const wsBase = API_BASE.replace("http", "ws");
  const ws = new WebSocket(`${wsBase}/ws/transactions`);

  ws.onopen = () => {
    ws.send("subscribe");
  };

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (_error) {
      // Ignore malformed events from transient network issues.
    }
  };

  return ws;
}
