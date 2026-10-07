import { useState, useEffect } from 'react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadOrders() {
    setLoading(true);
    setError(false);
    fetch('/orders', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadOrders(); }, []);

  if (loading) return <div className="state-loading">Loading orders...</div>;
  if (error) return <div className="state-error">Something went wrong. <button className="btn btn-secondary" onClick={loadOrders}>Try Again</button></div>;
  if (orders.length === 0) return <div className="state-empty">You haven't placed any orders yet.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2>My Orders</h2>
      {orders.map(o => (
        <div key={o.id} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <strong>Order #{o.id}</strong> — <span style={{ textTransform: 'capitalize' }}>{o.status}</span>
          <p>Total: ${(o.total_cents / 100).toFixed(2)}</p>
          <p>Shipping to: {o.shipping_name}, {o.shipping_address}</p>
          <p style={{ color: 'var(--color-secondary)', fontSize: 13 }}>{new Date(o.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}