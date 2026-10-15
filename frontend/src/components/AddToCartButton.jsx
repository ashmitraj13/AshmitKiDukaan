import { useState } from 'react'
import useCart from '../context/useCart'

function AddToCartButton({ product }) {
  const { addToCart, getQuantity, isPending } = useCart()
  const [error, setError] = useState('')

  const inCart = getQuantity(product._id)
  const adding = isPending(product._id)
  const outOfStock = product.stock === 0
  const atLimit = inCart >= product.stock

  const handleClick = async () => {
    if (adding) return // ignore clicks while a request is running
    setError('')
    try {
      await addToCart(product._id)
    } catch (err) {
      setError(err.message)
    }
  }

  let label = 'Add to Cart'
  if (outOfStock) label = 'Out of Stock'
  else if (adding) label = 'Adding...'
  else if (atLimit) label = 'Max in Cart'
  else if (inCart > 0) label = 'Add Another'

  return (
    <div className="cart-action">
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleClick}
        disabled={adding || outOfStock || atLimit}
      >
        {label}
      </button>
      {inCart > 0 && <small className="in-cart">✓ {inCart} in cart</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export default AddToCartButton
