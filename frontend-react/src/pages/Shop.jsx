import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../api';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  function loadProducts() {
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/products?search=${search}`)
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => {
    loadProducts();
  }, [search]);

  if (loading) return <div className="state-loading">Loading products...</div>;
  if (error) return (
    <div className="state-error">
      Something went wrong. <button className="btn btn-secondary" onClick={loadProducts}>Try Again</button>
    </div>
  );

  return (
    <div>
      <input
        className="search-input"
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ margin: '16px' }}
      />
      {products.length === 0 ? (
        <div className="state-empty">No products found.</div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <Link to={`/shop/${p.id}`} key={p.id} className="product-card">
              <img src={p.image_url} alt={p.name} />
              <h3>{p.name}</h3>
              <p>${(p.price_cents / 100).toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}