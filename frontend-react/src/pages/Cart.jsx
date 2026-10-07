import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  function loadCart() {
    setLoading(true);
    setError(false);
    fetch('/cart', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadCart(); }, []);

  async function updateQuantity(productId, quantity) {
    if (quantity < 1) return;
    await fetch(`/cart/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity })
    });
    loadCart();
  }

  async function removeItem(productId) {
    await fetch(`/cart/${productId}`, { method: 'DELETE', credentials: 'include' });
    loadCart();
  }

  if (loading) return <div className="state-loading">Loading cart...</div>;
  if (error) return <div className="state-error">Something went wrong. <button className="btn btn-secondary" onClick={loadCart}>Try Again</button></div>;
  if (items.length === 0) return <div className="state-empty">Your cart is empty. <Link to="/shop">Go shopping</Link></div>;

  const subtotal = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2>Your Cart</h2>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
          <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
          <div style={{ flex: 1 }}>
            <strong>{item.name}</strong>
            <p>${(item.price_cents / 100).toFixed(2)} each</p>
          </div>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={e => updateQuantity(item.id, Number(e.target.value))}
            style={{ width: 50 }}
          />
          <button className="btn btn-danger" onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <h3 style={{ textAlign: 'right' }}>Subtotal: ${(subtotal / 100).toFixed(2)}</h3>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/checkout')}>
        Proceed to Checkout
      </button>
    </div>
  );
}