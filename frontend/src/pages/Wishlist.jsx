import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getWishlist, removeFromWishlist } from '../services/api'
import WishlistCard from '../components/WishlistCard'

function Wishlist() {
  const { refreshWishlist } = useOutletContext()

  // Bumping `attempt` re-runs the fetch, which is how Try Again works
  const [attempt, setAttempt] = useState(0)
  // Which attempt the current result belongs to; a mismatch means loading
  const [result, setResult] = useState({ attempt: null, items: [], error: false })
  const loading = result.attempt !== attempt
  const { items, error } = result

  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState({ id: null, message: '' })

  useEffect(() => {
    let ignore = false

    getWishlist()
      .then((res) => {
        if (!ignore) setResult({ attempt, items: res.data.wishlist, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ attempt, items: [], error: true })
      })

    return () => {
      ignore = true
    }
  }, [attempt])

  const handleRemove = async (productId) => {
    if (removingId) return
    setRemovingId(productId)
    setRemoveError({ id: null, message: '' })

    try {
      await removeFromWishlist(productId)
      dropItem(productId)
    } catch (err) {
      // 404: it was already removed (e.g. in another tab), so drop it here too
      if (err.response?.status === 404) dropItem(productId)
      else setRemoveError({ id: productId, message: 'Unable to remove product. Please try again.' })
    } finally {
      setRemovingId(null)
      refreshWishlist()
    }
  }

  const dropItem = (productId) =>
    setResult((prev) => ({ ...prev, items: prev.items.filter((p) => p._id !== productId) }))

  if (loading) return <div className="state">Loading your wishlist...</div>

  if (error) {
    return (
      <div className="state empty-state">
        <h2>Something went wrong.</h2>
        <p>We couldn't load your wishlist.</p>
        <button type="button" className="btn btn-primary btn-cta" onClick={() => setAttempt((n) => n + 1)}>
          Try Again
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="state empty-state">
        <div className="empty-icon">❤️</div>
        <h2>Your wishlist is empty</h2>
        <p>Save products you love and find them here later.</p>
        <Link to="/products" className="btn btn-primary btn-cta">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>My Wishlist</h1>
        <span className="count">
          {items.length} {items.length === 1 ? 'product' : 'products'} saved
        </span>
        <Link to="/products" className="continue-link">
          Continue shopping →
        </Link>
      </div>

      <div className="product-grid">
        {items.map((product) => (
          <WishlistCard
            key={product._id}
            product={product}
            removing={removingId === product._id}
            error={removeError.id === product._id ? removeError.message : ''}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </main>
  )
}

export default Wishlist
