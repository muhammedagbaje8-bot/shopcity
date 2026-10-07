import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../api';

const CATEGORIES = [
  { icon: '👟', label: 'Fashion' },
  { icon: '🎧', label: 'Electronics' },
  { icon: '🛋️', label: 'Home & Living' },
  { icon: '💄', label: 'Beauty Items' },
  { icon: '🏀', label: 'Sports' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch('${API_BASE}/products')
      .then(res => res.json())
      .then(data => setFeatured(data.slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  const heroPair = featured.slice(0, 2);

  return (
    <div>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div>
            <span className="home-hero-badge">Now shipping nationwide</span>
            <h1>Everything you need, from people you can trust.</h1>
            <p className="lead">
              ShopCity brings thousands of products from verified sellers into one simple
              checkout — browse, buy, and track it all in one place.
            </p>
            <div className="home-hero-ctas">
              <Link to="/shop"><button className="btn btn-primary btn-lg">Start shopping</button></Link>
              <Link to="/shop"><button className="btn btn-secondary btn-lg" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Browse categories</button></Link>
            </div>
            <div className="home-trust-row">
              <span>🔒 Secure checkout</span>
              <span>🚚 Fast delivery</span>
              <span>↩️ Easy returns</span>
            </div>
          </div>
          <div className="home-hero-visual">
            {heroPair[0] && (
              <div className="home-hero-card c1">
                <img src={heroPair[0].image_url} alt={heroPair[0].name} />
                <div className="tag">In stock</div>
                <div className="name">{heroPair[0].name}</div>
                <div className="price">${(heroPair[0].price_cents / 100).toFixed(2)}</div>
              </div>
            )}
            {heroPair[1] && (
              <div className="home-hero-card c2">
                <img src={heroPair[1].image_url} alt={heroPair[1].name} />
                <div className="tag">In stock</div>
                <div className="name">{heroPair[1].name}</div>
                <div className="price">${(heroPair[1].price_cents / 100).toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>Shop by category</h2>
          <p>Jump straight to what you're looking for.</p>
        </div>
        <div className="category-strip">
          {CATEGORIES.map(c => (
            <Link to="/shop" key={c.label} className="category-card">
              <span className="icon">{c.icon}</span>
              <span className="label">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="home-section" style={{ paddingTop: 0 }}>
          <div className="home-section-head">
            <h2>Popular right now</h2>
            <p>A few things other shoppers are adding to cart today.</p>
          </div>
          <div className="product-grid" style={{ padding: 0 }}>
            {featured.map(p => (
              <Link to={`/shop/${p.id}`} key={p.id} className="product-card">
                <img src={p.image_url} alt={p.name} />
                <h3>{p.name}</h3>
                <p>${(p.price_cents / 100).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section home-why">
        <div className="home-section-head">
          <h2>Why people shop with us</h2>
          <p>The basics, done properly.</p>
        </div>
        <div className="why-grid">
          <div className="why-item">
            <div className="icon">🔒</div>
            <h3>Secure payments</h3>
            <p>Every order is verified before it's confirmed, so your payment is never taken twice and never lost.</p>
          </div>
          <div className="why-item">
            <div className="icon">⚡</div>
            <h3>Checkout in seconds</h3>
            <p>Save your details once and check out in a couple of taps the next time you shop.</p>
          </div>
          <div className="why-item">
            <div className="icon">💬</div>
            <h3>Real support</h3>
            <p>A confirmation email lands the moment you order, and a real person is behind every account.</p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div>
          <h2>Ready to find something you'll love?</h2>
          <p>Create a free account and start shopping in under a minute.</p>
        </div>
        <Link to="/register"><button className="btn btn-dark btn-lg">Create free account</button></Link>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <div className="brand-mark" style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                Shop<span style={{ color: 'var(--sc-marigold)' }}>City</span>
              </span>
            </div>
            <p style={{ color: 'var(--color-secondary)', fontSize: 14, maxWidth: 280, margin: 0 }}>
              A simple, honest place to shop online.
            </p>
          </div>
          <div className="site-footer-links">
            <Link to="/shop">Shop</Link>
            <Link to="/orders">My orders</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
        <div className="site-footer-copy">© {new Date().getFullYear()} ShopCity. All rights reserved.</div>
      </footer>
    </div>
  );
}