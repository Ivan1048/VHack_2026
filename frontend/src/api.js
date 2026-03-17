const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getRecentTransactions(limit = 50) {
  const res = await fetch(`${API_BASE}/transactions/recent?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function getThresholds() {
  const res = await fetch(`${API_BASE}/thresholds`);
  if (!res.ok) throw new Error("Failed to fetch thresholds");
  return res.json();
}

export async function submitFeedback(txn_id, label) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txn_id, label }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function predictTransaction(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export function createTransactionsSocket(onMessage) {
  const wsBase = API_BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/ws/transactions`);

  ws.onopen = () => ws.send("subscribe");

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (_) {
      // Ignore malformed events
    }
  };

  return ws;
}
