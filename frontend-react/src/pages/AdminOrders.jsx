import { useState, useEffect } from 'react';

const STATUSES = ['pending', 'shipped', 'delivered'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadOrders() {
    setLoading(true);
    setError(false);
    fetch('/admin/orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(id, status) {
    await fetch(`/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    loadOrders();
  }

  if (loading) return <div className="state-loading">Loading orders...</div>;
  if (error) return <div className="state-error">Something went wrong. <button className="btn btn-secondary" onClick={loadOrders}>Try Again</button></div>;
  if (orders.length === 0) return <div className="state-empty">No orders yet.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2>All Orders</h2>
      {orders.map(o => (
        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div>
            <strong>Order #{o.id}</strong> — {o.username}
            <p>${(o.total_cents / 100).toFixed(2)} — {o.shipping_name}, {o.shipping_address}</p>
          </div>
          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}