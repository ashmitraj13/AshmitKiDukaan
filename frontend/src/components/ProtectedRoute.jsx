import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getMe, getWishlistIds } from '../services/api'
import Navbar from './Navbar'
import CartProvider from '../context/CartProvider'

// Wraps every page that needs a logged-in customer. The cookie is HttpOnly,
// so JS can't check it; asking the server via /customers/me is the only way.
function ProtectedRoute() {
  const [customer, setCustomer] = useState(null)
  const [status, setStatus] = useState('checking') // checking | ok | denied

  // Ids of saved products, as last reported by the backend. Used for the
  // navbar count and to show ♥ on cards that are already saved.
  const [wishlistIds, setWishlistIds] = useState([])

  const refreshWishlist = useCallback(
    () =>
      getWishlistIds()
        .then((res) => setWishlistIds(res.data.productIds))
        .catch(() => {}), // the count is a nice-to-have; pages handle their own errors
    [],
  )

  useEffect(() => {
    getMe()
      .then((res) => {
        setCustomer(res.data)
        return refreshWishlist()
      })
      .then(() => setStatus('ok'))
      .catch(() => setStatus('denied'))
  }, [refreshWishlist])

  if (status === 'checking') return <div className="state">Loading…</div>
  if (status === 'denied') return <Navigate to="/login" replace />

  // The cart is shared by the navbar, product cards and cart page, so it lives
  // in one provider here. Logging out unmounts it, which clears the cart state.
  return (
    <CartProvider>
      <Navbar customer={customer} wishlistCount={wishlistIds.length} />
      <Outlet context={{ customer, wishlistIds, refreshWishlist }} />
    </CartProvider>
  )
}

export default ProtectedRoute
