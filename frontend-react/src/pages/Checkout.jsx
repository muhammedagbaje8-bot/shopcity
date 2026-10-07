import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import API_BASE from '../api';

const PAYSTACK_PUBLIC_KEY = 'pk_test_bc941021cd4c42daaefbf2425ac9982c63903e93';

export default function Checkout() {
  const { user } = useAuth();
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setProcessing(true);

    const initRes = await fetch('${API_BASE}/checkout/initialize', { method: 'POST', credentials: 'include' });
    const initData = await initRes.json();
    if (!initRes.ok) {
      setError(initData.error);
      setProcessing(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email || '',
      amount: initData.total,
      ref: initData.reference,
      callback: function (response) {
        fetch('${API_BASE}/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            shipping_name: shippingName,
            shipping_address: shippingAddress,
            paystack_reference: response.reference
          })
        })
          .then(res => res.json())
          .then(data => navigate('/orders'));
      },
      onClose: function () {
        setProcessing(false);
      }
    });
    handler.openIframe();
  }

  return (
    <div className="form-container">
      <h2>Checkout</h2>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handlePay}>
        <input placeholder="Full Name" value={shippingName} onChange={e => setShippingName(e.target.value)} required />
        <input placeholder="Shipping Address" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required />
        <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={processing}>
          {processing ? 'Processing...' : 'Pay with Paystack'}
        </button>
      </form>
    </div>
  );
}