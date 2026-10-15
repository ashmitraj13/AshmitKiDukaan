import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { advanceOrderStatus, getErrorMessage, getOrderById } from '../services/api'
import { formatDate, formatPrice } from '../utils/format'
import { StatusBadge, StatusTracker } from '../components/OrderStatus'

function OrderDetails() {
  const { id } = useParams()
  const location = useLocation()
  const justPlaced = location.state?.justPlaced // set by Checkout after verified payment

  // Which id the current result belongs to; a mismatch means we're loading
  const [result, setResult] = useState({ id: null, order: null, error: '' })
  const loading = result.id !== id
  const { order, error } = result

  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    let ignore = false

    getOrderById(id)
      .then((res) => {
        if (!ignore) setResult({ id, order: res.data.order, error: '' })
      })
      .catch((err) => {
        if (!ignore) setResult({ id, order: null, error: getErrorMessage(err, 'Unable to load this order.') })
      })

    return () => {
      ignore = true
    }
  }, [id])

  // Bonus: dev-only helper to demo status progression
  const handleAdvance = async () => {
    setAdvancing(true)
    try {
      const res = await advanceOrderStatus(id)
      setResult({ id, order: res.data.order, error: '' })
    } catch {
      // the button simply stays put; this is a dev helper
    } finally {
      setAdvancing(false)
    }
  }

  if (loading) return <div className="state">Loading order...</div>

  if (error) {
    return (
      <div className="state state-error">
        <p>{error}</p>
        <Link to="/orders">← Back to my orders</Link>
      </div>
    )
  }

  const paid = order.paymentStatus === 'PAID'

  return (
    <main className="details-page order-details">
      {justPlaced && paid ? (
        <section className="card success-banner">
          <div className="success-icon">✅</div>
          <h1>Order Placed Successfully</h1>
          <p>Your order has been saved successfully.</p>
        </section>
      ) : (
        <Link to="/orders" className="back-link">
          ← My Orders
        </Link>
      )}

      <section className="card order-overview">
        <dl className="order-meta">
          <dt>Order ID</dt>
          <dd className="mono">{order._id}</dd>
          <dt>Placed on</dt>
          <dd>{formatDate(order.createdAt)}</dd>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={order.status} />
          </dd>
          <dt>Payment</dt>
          <dd>
            {order.paymentStatus}
            {order.razorpayPaymentId && <span className="mono muted"> · {order.razorpayPaymentId}</span>}
          </dd>
          <dt>Total</dt>
          <dd className="summary-total">{formatPrice(order.totalAmount)}</dd>
        </dl>

        <StatusTracker status={order.status} />

        {import.meta.env.DEV && paid && order.status !== 'DELIVERED' && (
          <button type="button" className="btn btn-outline dev-button" onClick={handleAdvance} disabled={advancing}>
            {advancing ? 'Updating…' : 'Advance status (dev only)'}
          </button>
        )}
      </section>

      <div className="order-details-grid">
        <section className="card">
          <h2>Items</h2>
          {/* Purchase-time snapshot: these prices don't change if the product does */}
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.product}>
                {item.image && <img src={item.image} alt="" />}
                <div>
                  <Link to={`/products/${item.product}`}>{item.name}</Link>
                  <small>
                    {formatPrice(item.price)} × {item.quantity}
                  </small>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Shipping To</h2>
          <address className="shipping-address">
            <strong>{order.shippingAddress.fullName}</strong>
            <span>{order.shippingAddress.addressLine1}</span>
            <span>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </span>
            <span>📞 {order.shippingAddress.phone}</span>
          </address>
        </section>
      </div>

      <div className="order-actions">
        <Link to="/orders" className="btn btn-primary">
          View My Orders
        </Link>
        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>
    </main>
  )
}

export default OrderDetails
