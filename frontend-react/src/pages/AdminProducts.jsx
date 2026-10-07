import { useState, useEffect } from 'react';
import API_BASE from '../api';

const emptyForm = { name: '', description: '', price_cents: '', image_url: '', stock_quantity: '', category: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  function loadProducts() {
    setLoading(true);
    setError(false);
    fetch('${API_BASE}/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, price_cents: Number(form.price_cents), stock_quantity: Number(form.stock_quantity) };
    const url = editingId ? `/admin/products/${editingId}` : '/admin/products';
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    setForm(emptyForm);
    setEditingId(null);
    loadProducts();
  }

  function startEdit(p) {
    setForm({ name: p.name, description: p.description, price_cents: p.price_cents, image_url: p.image_url, stock_quantity: p.stock_quantity, category: p.category });
    setEditingId(p.id);
  }

  async function deleteProduct(id) {
    await fetch(`${API_BASE}/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
    loadProducts();
  }

  if (loading) return <div className="state-loading">Loading products...</div>;
  if (error) return <div className="state-error">Something went wrong. <button className="btn btn-secondary" onClick={loadProducts}>Try Again</button></div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Manage Products</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'grid', gap: 8, maxWidth: 400 }}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Price (cents)" type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: e.target.value })} required />
        <input placeholder="Image URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
        <input placeholder="Stock Quantity" type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} required />
        <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <button className="btn btn-primary" type="submit">{editingId ? 'Update Product' : 'Add Product'}</button>
      </form>

      {products.length === 0 ? (
        <div className="state-empty">No products yet.</div>
      ) : (
        products.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', padding: '8px 0' }}>
            <div>
              <strong>{p.name}</strong> — ${(p.price_cents / 100).toFixed(2)} — {p.stock_quantity} in stock
              {p.stock_quantity <= p.low_stock_threshold && <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>⚠ Low stock</span>}
            </div>
            <div>
              <button className="btn btn-secondary" onClick={() => startEdit(p)}>Edit</button>
              <button className="btn btn-danger" onClick={() => deleteProduct(p.id)} style={{ marginLeft: 8 }}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}