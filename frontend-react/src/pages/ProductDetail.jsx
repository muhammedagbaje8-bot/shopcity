import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import API_BASE from '../api';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [addedMsg, setAddedMsg] = useState('');

  function loadProduct() {
    setLoading(true);
    setError(false);
    fetch(`/products/${id}`)
      .then(res => res.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadProduct(); }, [id]);

  async function addToCart() {
    await fetch('/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ product_id: id, quantity: 1 })
    });
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2000);
  }

  async function submitReview(e) {
    e.preventDefault();
    await fetch(`/products/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rating, comment })
    });
    setComment('');
    loadProduct();
  }

  if (loading) return <div className="state-loading">Loading product...</div>;
  if (error) return <div className="state-error">Something went wrong. <button className="btn btn-secondary" onClick={loadProduct}>Try Again</button></div>;
  if (!product) return <div className="state-empty">Product not found.</div>;

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <img src={product.image_url} alt={product.name} style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 6 }} />
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p><strong>${(product.price_cents / 100).toFixed(2)}</strong></p>
      <p>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}</p>

      {user && (
        <button className="btn btn-primary" onClick={addToCart} disabled={product.stock_quantity === 0}>
          Add to Cart
        </button>
      )}
      {addedMsg && <span style={{ marginLeft: 12, color: 'green' }}>{addedMsg}</span>}

      <h3 style={{ marginTop: 32 }}>Reviews</h3>
      {product.reviews.length === 0 ? (
        <p className="state-empty">No reviews yet.</p>
      ) : (
        product.reviews.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid var(--color-border)', padding: '8px 0' }}>
            <strong>{r.username}</strong> — {'⭐'.repeat(r.rating)}
            <p>{r.comment}</p>
          </div>
        ))
      )}

      {user && (
        <form onSubmit={submitReview} style={{ marginTop: 16 }}>
          <select value={rating} onChange={e => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
          <input placeholder="Write a review..." value={comment} onChange={e => setComment(e.target.value)} style={{ margin: '8px 0', width: '100%', padding: 8, boxSizing: 'border-box' }} />
          <button className="btn btn-secondary" type="submit">Submit Review</button>
        </form>
      )}
    </div>
  );
}