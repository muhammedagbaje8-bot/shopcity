import { Link, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Logo, { Wordmark } from './Logo.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav className="layout-nav">
        <div className="layout-nav-links">
          <Link to="/" className="brand-mark">
            <Logo />
            <Wordmark />
          </Link>
          <Link to="/shop">Shop</Link>
          {user && <Link to="/cart">Cart</Link>}
          {user && <Link to="/orders">My Orders</Link>}
          {user?.role === 'admin' && <Link to="/admin/products">Admin: Products</Link>}
          {user?.role === 'admin' && <Link to="/admin/orders">Admin: Orders</Link>}
        </div>
        <div className="layout-nav-right">
          {user ? (
            <>
              <span>{user.username}{user.role === 'admin' && <span className="admin-badge">ADMIN</span>}</span>
              <button className="btn btn-secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register"><button className="btn btn-primary">Sign up</button></Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}