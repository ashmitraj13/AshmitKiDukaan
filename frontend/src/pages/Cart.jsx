import { Link } from 'react-router-dom'
import useCart from '../context/useCart'
import CartItem from '../components/CartItem'
import OrderSummary from '../components/OrderSummary'

function Cart() {
  // Read from the shared cart state; no separate fetch here
  const { cartItems, loading, error, refreshCart } = useCart()

  if (loading) return <div className="state">Loading your cart...</div>

  if (error) {
    return (
      <div className="state empty-state">
        <h2>Unable to load your cart.</h2>
        <button type="button" className="btn btn-primary btn-cta" onClick={refreshCart}>
          Try Again
        </button>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="state empty-state">
        <div className="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-primary btn-cta">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>My Cart</h1>
        <Link to="/products" className="continue-link">
          Continue shopping →
        </Link>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </section>
        <OrderSummary />
      </div>
    </main>
  )
}

export default Cart
