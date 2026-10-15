import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { addToWishlist, removeFromWishlist } from '../services/api'

// Toggles a product in the wishlist: POST to save, DELETE to remove.
// `saved` comes from the backend (via ProtectedRoute) when the card mounts.
function WishlistButton({ productId }) {
  const { wishlistIds, refreshWishlist } = useOutletContext()

  const [saved, setSaved] = useState(() => wishlistIds.includes(productId))
  const [saving, setSaving] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const ref = timerRef
    return () => clearTimeout(ref.current)
  }, [])

  const handleClick = async () => {
    if (saving) return // ignore clicks while a request is running
    setSaving(true)
    setError('')

    try {
      if (saved) {
        await removeFromWishlist(productId)
        setSaved(false)
        setJustAdded(false)
      } else {
        await addToWishlist(productId)
        setSaved(true)
        setJustAdded(true)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setJustAdded(false), 2000)
      }
    } catch (err) {
      const status = err.response?.status
      // 409 / 404 mean the backend already has the state we wanted (e.g. it
      // was changed in another tab), so just reflect that instead of erroring
      if (!saved && status === 409) setSaved(true)
      else if (saved && status === 404) setSaved(false)
      else setError(saved ? 'Unable to remove product. Please try again.' : 'Unable to save product. Please try again.')
    } finally {
      setSaving(false)
      refreshWishlist() // keep the navbar count in sync with the backend
    }
  }

  let label = '♡ Add to Wishlist'
  if (saving) label = '⏳ Saving...'
  else if (justAdded) label = '♥ Added to Wishlist'
  else if (saved) label = '♥ Remove from Wishlist'

  return (
    <div className="wishlist-action">
      <button
        type="button"
        className={`btn btn-wishlist${saved ? ' is-saved' : ''}`}
        onClick={handleClick}
        disabled={saving}
        aria-pressed={saved}
      >
        {label}
      </button>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

export default WishlistButton
