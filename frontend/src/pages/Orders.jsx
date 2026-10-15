import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrders } from '../services/api'
import OrderCard from '../components/OrderCard'

function Orders() {
  // Bumping `attempt` re-runs the fetch, which is how Try Again works
  const [attempt, setAttempt] = useState(0)
  // Which attempt the current result belongs to; a mismatch means loading
  const [result, setResult] = useState({ attempt: null, orders: [], error: false })
  const loading = result.attempt !== attempt
  const { orders, error } = result

  useEffect(() => {
    let ignore = false

    getOrders()
      .then((res) => {
        if (!ignore) setResult({ attempt, orders: res.data.orders, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ attempt, orders: [], error: true })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  if (loading) return <div className="state">Loading your orders...</div>

  if (error) {
    return (
      <div className="state empty-state">
        <h2>Unable to load your orders.</h2>
        <button type="button" className="btn btn-primary btn-cta" onClick={() => setAttempt((n) => n + 1)}>
          Try Again
        </button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="state empty-state">
        <div className="empty-icon">📦</div>
        <h2>You have not placed any orders yet.</h2>
        <Link to="/products" className="btn btn-primary btn-cta">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <main className="products-page orders-page">
      <div className="products-header">
        <h1>My Orders</h1>
        <span className="count">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      <div className="order-list">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </main>
  )
}

export default Orders
