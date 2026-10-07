require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// --- Auth routes (same pattern as blog-site Classes 6-8) ---

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashed);
    req.session.userId = result.lastInsertRowid;
    req.session.role = 'user';
    res.status(201).json({ id: result.lastInsertRowid, username });
  } catch (err) {
    res.status(400).json({ error: 'Username or email already taken' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (!user.password) {
    return res.status(400).json({ error: 'This account was created with Google Sign-In. Please use the Google button instead.' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ id: user.id, username: user.username, role: user.role, email: user.email });
});

app.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(payload.email);
    if (!user) {
      const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, NULL)').run(payload.email.split('@')[0], payload.email);
      user = { id: result.lastInsertRowid, role: 'user', username: payload.email.split('@')[0], email: payload.email };
    }
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ id: user.id, username: user.username, role: user.role, email: user.email });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  res.json(db.prepare(query).all(...params));
});

app.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const reviews = db.prepare('SELECT reviews.*, users.username FROM reviews JOIN users ON reviews.user_id = users.id WHERE product_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...product, reviews });
});

app.post('/admin/products', requireAdmin, (req, res) => {
  const { name, description, price_cents, image_url, stock_quantity, category } = req.body;
  const result = db.prepare('INSERT INTO products (name, description, price_cents, image_url, stock_quantity, category) VALUES (?, ?, ?, ?, ?, ?)').run(name, description, price_cents, image_url, stock_quantity, category);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/admin/products/:id', requireAdmin, (req, res) => {
  const { name, description, price_cents, image_url, stock_quantity, category } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price_cents=?, image_url=?, stock_quantity=?, category=? WHERE id=?').run(name, description, price_cents, image_url, stock_quantity, category, req.params.id);
  res.json({ success: true });
});

app.delete('/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/products/:id/reviews', requireLogin, (req, res) => {
  const { rating, comment } = req.body;
  db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.params.id, req.session.userId, rating, comment);
  res.status(201).json({ success: true });
});

app.get('/cart', requireLogin, (req, res) => {
  const items = db.prepare(`
    SELECT cart_items.id, cart_items.quantity, products.*
    FROM cart_items JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
  `).all(req.session.userId);
  res.json(items);
});

app.post('/cart', requireLogin, (req, res) => {
  const { product_id, quantity } = req.body;
  db.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(req.session.userId, product_id, quantity || 1);
  res.json({ success: true });
});

app.put('/cart/:productId', requireLogin, (req, res) => {
  db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?').run(req.body.quantity, req.session.userId, req.params.productId);
  res.json({ success: true });
});

app.delete('/cart/:productId', requireLogin, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.session.userId, req.params.productId);
  res.json({ success: true });
});

const axios = require('axios');

app.post('/checkout/initialize', requireLogin, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const cartItems = db.prepare(`
    SELECT cart_items.quantity, products.price_cents FROM cart_items
    JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
  `).all(req.session.userId);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const total = cartItems.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { email: user.email, amount: total },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    res.json({ authorization_url: response.data.data.authorization_url, reference: response.data.data.reference, total });
  } catch (err) {
    res.status(500).json({ error: 'Could not start payment' });
  }
});

app.post('/orders', requireLogin, async (req, res) => {
  const { shipping_name, shipping_address, paystack_reference } = req.body;

  if (!shipping_name || !shipping_address) {
    return res.status(400).json({ error: 'Shipping name and address are required' });
  }

  try {
    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${paystack_reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    if (verify.data.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not verified' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Could not verify payment' });
  }

  const cartItems = db.prepare(`
    SELECT cart_items.product_id, cart_items.quantity, products.name, products.price_cents, products.stock_quantity
    FROM cart_items JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
  `).all(req.session.userId);

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });
  for (const item of cartItems) {
    if (item.stock_quantity < item.quantity) return res.status(400).json({ error: `Not enough stock for ${item.name}` });
  }

  const total = cartItems.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  const createOrder = db.transaction(() => {
    const orderResult = db.prepare('INSERT INTO orders (user_id, total_cents, shipping_name, shipping_address, stripe_payment_id) VALUES (?, ?, ?, ?, ?)').run(req.session.userId, total, shipping_name, shipping_address, paystack_reference);
    const orderId = orderResult.lastInsertRowid;
    for (const item of cartItems) {
      db.prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)').run(orderId, item.product_id, item.name, item.price_cents, item.quantity);
      db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?').run(item.quantity, item.product_id);
    }
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.session.userId);
    return orderId;
  });

  const orderId = createOrder();
  sendOrderConfirmationEmail(req.session.userId, orderId);
  checkLowStock(cartItems);
  res.status(201).json({ orderId });
});

app.get('/orders', requireLogin, (req, res) => {
  res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId));
});

app.get('/admin/orders', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT orders.*, users.username FROM orders JOIN users ON orders.user_id = users.id ORDER BY created_at DESC').all());
});

app.put('/admin/orders/:id/status', requireAdmin, (req, res) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

function checkLowStock(cartItems) {
  for (const item of cartItems) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (product.stock_quantity <= product.low_stock_threshold) {
      console.log(`⚠️  LOW STOCK: ${product.name} has ${product.stock_quantity} left`);
    }
  }
}

app.get('/admin/low-stock', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM products WHERE stock_quantity <= low_stock_threshold').all());
});

const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

function sendOrderConfirmationEmail(userId, orderId) {
  if (!transporter) {
    console.log(`[email] Skipped (no EMAIL_USER/EMAIL_PASS configured) — would have emailed order #${orderId} confirmation.`);
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Order #${orderId} Confirmed`,
    text: `Thanks for your order! Total: $${(order.total_cents / 100).toFixed(2)}. We'll notify you when it ships.`
  }).catch(err => console.error('Email failed:', err.message));
}

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));