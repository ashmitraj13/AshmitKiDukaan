import { useNavigate } from 'react-router-dom'
import useCart from '../context/useCart'
import { formatPrice } from '../utils/format'

function OrderSummary() {
  const { totalUnits, subtotal, hasStockIssues } = useCart()
  const navigate = useNavigate()

  return (
    <aside className="card order-summary">
      <h2>Order Summary</h2>
      <dl>
        <dt>Items</dt>
        <dd>{totalUnits}</dd>
        <dt>Subtotal</dt>
        <dd className="summary-total">{formatPrice(subtotal)}</dd>
      </dl>

      <button
        type="button"
        className="btn btn-primary"
        disabled={hasStockIssues}
        onClick={() => navigate('/checkout')}
      >
        Proceed to Checkout
      </button>

      {hasStockIssues && <small className="field-error">Fix the stock issues above to continue.</small>}
    </aside>
  )
}

export default OrderSummary
