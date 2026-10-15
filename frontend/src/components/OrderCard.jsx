import { Link } from 'react-router-dom'
import { formatDate, formatPrice, shortId } from '../utils/format'
import { StatusBadge } from './OrderStatus'

function OrderCard({ order }) {
  return (
    <article className="card order-card">
      <header className="order-card-header">
        <div>
          <h3>Order #{shortId(order._id)}</h3>
          <span className="order-date">{formatDate(order.createdAt)}</span>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {/* Names and quantities come from the order's own snapshot */}
      <ul className="order-card-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>

      <footer className="order-card-footer">
        <span>
          Total: <strong>{formatPrice(order.totalAmount)}</strong>
        </span>
        <Link to={`/orders/${order._id}`} className="btn btn-outline">
          View Details
        </Link>
      </footer>
    </article>
  )
}

export default OrderCard
