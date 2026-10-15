import { useState } from 'react'
import { Link } from 'react-router-dom'
import useCart from '../context/useCart'
import { formatPrice } from '../utils/format'
import ProductImage from './ProductImage'

function CartItem({ item }) {
  const { product, quantity } = item
  const { updateQuantity, removeFromCart, isPending } = useCart()
  const [error, setError] = useState('')

  // Only this row is disabled while its own request runs
  const busy = isPending(product._id)
  const outOfStock = product.stock === 0
  const overStock = quantity > product.stock

  const run = async (action) => {
    if (busy) return
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
  }

  // If stock dropped below what's in the cart, "−" jumps straight to the max
  const decrease = () => run(() => updateQuantity(product._id, Math.min(quantity - 1, product.stock)))
  const increase = () => run(() => updateQuantity(product._id, quantity + 1))
  const remove = () => run(() => removeFromCart(product._id))

  return (
    <article className={`cart-item${busy ? ' is-busy' : ''}`}>
      <Link to={`/products/${product._id}`} className="cart-item-image">
        <ProductImage src={product.image} alt={product.name} />
      </Link>

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <span className="cart-item-unit">{formatPrice(product.price)} each</span>

        {outOfStock ? (
          <small className="field-error">Out of stock. Remove it to continue.</small>
        ) : (
          overStock && (
            <small className="field-error">Only {product.stock} in stock. Lower the quantity to continue.</small>
          )
        )}

        <div className="cart-item-controls">
          <div className="qty" aria-label={`Quantity of ${product.name}`}>
            <button
              type="button"
              onClick={decrease}
              disabled={busy || quantity <= 1 || outOfStock}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={increase}
              disabled={busy || quantity >= product.stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button type="button" className="link-danger" onClick={remove} disabled={busy}>
            {busy ? 'Updating…' : 'Remove'}
          </button>
        </div>

        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}
      </div>

      <div className="cart-item-total">{formatPrice(product.price * quantity)}</div>
    </article>
  )
}

export default CartItem
