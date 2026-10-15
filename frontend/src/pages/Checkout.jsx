import { useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import useCart from '../context/useCart'
import CheckoutForm from '../components/CheckoutForm'
import { createPaymentOrder, getErrorMessage, verifyPayment } from '../services/api'
import { formatPrice } from '../utils/format'
import loadRazorpay from '../utils/loadRazorpay'
import validateAddress from '../utils/validateAddress'

const BUTTON_LABELS = {
  creating: 'Preparing payment…',
  paying: 'Waiting for payment…',
  verifying: 'Verifying payment…',
}

function Checkout() {
  const { customer } = useOutletContext()
  const { cartItems, loading, error, subtotal, hasStockIssues, refreshCart, syncCart } = useCart()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  // idle -> creating (backend order) -> paying (Razorpay open) -> verifying
  const [step, setStep] = useState('idle')
  // Razorpay callbacks fire outside React's render, so they read the step from a ref
  const stepRef = useRef('idle')
  const goTo = (next) => {
    stepRef.current = next
    setStep(next)
  }
  const busy = step !== 'idle'

  const handleChange = (e) => {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const confirmPayment = async (shopKartOrderId, response) => {
    goTo('verifying')
    try {
      // The browser only passes Razorpay's response on; the server checks the signature
      const res = await verifyPayment({
        shopKartOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      })
      navigate(`/orders/${res.data.order._id}`, { replace: true, state: { justPlaced: true } })
      syncCart() // backend cleared the cart; pull that into global state -> navbar shows 0
    } catch (err) {
      goTo('idle')
      setMessage(
        `${getErrorMessage(err, 'We could not verify your payment.')} Your cart has not been cleared. ` +
          `If money was deducted, contact support with payment ID ${response.razorpay_payment_id}.`,
      )
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (busy) return

    // 1. Client-side validation first: no request if the form is invalid
    const validationErrors = validateAddress(address)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    setMessage('')
    goTo('creating')

    if (!(await loadRazorpay())) {
      goTo('idle')
      setMessage('Unable to load Razorpay Checkout. Check your connection or disable ad blockers, then try again.')
      return
    }

    // 2. Server validates stock, snapshots prices, calculates the total and
    //    creates the Razorpay order. We send only the address.
    let data
    try {
      const trimmed = Object.fromEntries(Object.entries(address).map(([k, v]) => [k, v.trim()]))
      data = (await createPaymentOrder(trimmed)).data
    } catch (err) {
      goTo('idle')
      setErrors(err.response?.data?.errors || {})
      setMessage(getErrorMessage(err, 'Unable to start checkout. Please try again.'))
      syncCart() // stock or prices may have changed; show the latest cart
      return
    }

    // 3. Open Razorpay Checkout with the server-created order
    const razorpay = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: 'ShopKart',
      description: 'ShopKart Order',
      prefill: { name: address.fullName.trim(), contact: address.phone.trim() },
      theme: { color: '#4f46e5' },
      // Success here is NOT trusted; it only hands the details to our backend
      handler: (response) => confirmPayment(data.shopKartOrderId, response),
      modal: {
        ondismiss: () => {
          if (stepRef.current !== 'paying') return
          goTo('idle')
          setMessage((prev) => prev || 'Payment cancelled. Your cart has not been changed.')
        },
      },
    })

    razorpay.on('payment.failed', (response) => {
      // Razorpay keeps its window open so the user can retry there
      const reason = response.error?.description ? ` (${response.error.description})` : ''
      setMessage(`Payment failed${reason}. Your cart has not been cleared. Please try again.`)
    })

    goTo('paying')
    razorpay.open()
  }

  if (loading) return <div className="state">Loading checkout...</div>

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

  // Opening /checkout directly with nothing in the cart
  if (cartItems.length === 0 && !busy) {
    return (
      <div className="state empty-state">
        <div className="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add something to your cart before checking out.</p>
        <Link to="/products" className="btn btn-primary btn-cta">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>Checkout</h1>
        <Link to="/cart" className="continue-link">
          ← Back to cart
        </Link>
      </div>

      <form className="checkout-layout" onSubmit={handlePlaceOrder} noValidate>
        <CheckoutForm values={address} errors={errors} onChange={handleChange} disabled={busy} />

        <aside className="card order-summary">
          <h2>Order Summary</h2>
          <ul className="checkout-items">
            {cartItems.map(({ product, quantity }) => (
              <li key={product._id}>
                <span>
                  {product.name} × {quantity}
                </span>
                <span>{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <dt>Total</dt>
            <dd className="summary-total">{formatPrice(subtotal)}</dd>
          </dl>
          <p className="summary-note">The final amount is confirmed by the server before payment.</p>

          {hasStockIssues && (
            <div className="alert alert-error">
              Some items exceed available stock. <Link to="/cart">Update your cart</Link> to continue.
            </div>
          )}
          {message && (
            <div className="alert alert-error" role="alert">
              {message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy || hasStockIssues}>
            {BUTTON_LABELS[step] || `Place Order · ${formatPrice(subtotal)}`}
          </button>
          <p className="summary-note">🔒 Razorpay Test Mode. No real money is charged.</p>
        </aside>
      </form>
    </main>
  )
}

export default Checkout
