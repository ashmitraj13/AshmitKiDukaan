import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logoutCustomer } from '../services/api'
import useCart from '../context/useCart'

// Only rendered when logged in, i.e. inside CartProvider
function CartLink() {
  const { totalUnits } = useCart() // total quantity, derived from cart state
  return (
    <NavLink to="/cart">
      Cart{totalUnits > 0 && <span className="badge">{totalUnits}</span>}
    </NavLink>
  )
}

// customer is passed in on protected pages; public pages render it without one
function Navbar({ customer, wishlistCount = 0 }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutCustomer() // server clears the HttpOnly cookie
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="navbar">
      <Link to={customer ? '/home' : '/login'} className="brand">
        🛒 ShopKart
      </Link>
      <nav>
        {customer ? (
          <>
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/wishlist">
              Wishlist{wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </NavLink>
            <CartLink />
            <NavLink to="/orders">Orders</NavLink>
            <button type="button" className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

export default Navbar
