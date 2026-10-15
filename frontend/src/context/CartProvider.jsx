import { useCallback, useEffect, useMemo, useState } from 'react'
import CartContext from './CartContext'
import {
  addToCart as addToCartApi,
  getCart,
  getErrorMessage,
  removeFromCart as removeFromCartApi,
  updateCartQuantity as updateCartQuantityApi,
} from '../services/api'

// The single frontend copy of the cart. MongoDB is the real source of truth:
// every mutation returns the updated cart from the backend, and we store that.
function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]) // [{ product: {...}, quantity }]
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [pending, setPending] = useState({}) // productId -> true while its request runs

  const loadCart = useCallback(
    () =>
      getCart()
        .then((res) => {
          setCartItems(res.data.cart)
          setStatus('ready')
        })
        .catch(() => setStatus('error')),
    [],
  )

  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Used by Try Again: show the loading state, then fetch
  const refreshCart = useCallback(() => {
    setStatus('loading')
    return loadCart()
  }, [loadCart])

  // Runs one cart API call for one product and stores the cart it returns.
  // On failure, re-syncs with the backend (e.g. stock changed) and rethrows a
  // readable message so the component that triggered it can show it.
  const mutate = useCallback(async (productId, request, fallback) => {
    setPending((prev) => ({ ...prev, [productId]: true }))
    try {
      const res = await request()
      setCartItems(res.data.cart)
    } catch (error) {
      getCart()
        .then((res) => setCartItems(res.data.cart))
        .catch(() => {})
      throw new Error(getErrorMessage(error, fallback), { cause: error })
    } finally {
      setPending((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    }
  }, [])

  const addToCart = useCallback(
    (productId) => mutate(productId, () => addToCartApi(productId), 'Unable to add to cart.'),
    [mutate],
  )

  const updateQuantity = useCallback(
    (productId, quantity) =>
      mutate(productId, () => updateCartQuantityApi(productId, quantity), 'Unable to update quantity.'),
    [mutate],
  )

  const removeFromCart = useCallback(
    (productId) => mutate(productId, () => removeFromCartApi(productId), 'Unable to remove item.'),
    [mutate],
  )

  const value = useMemo(() => {
    // Derived values: calculated from cartItems, never stored separately
    const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const hasStockIssues = cartItems.some((item) => item.quantity > item.product.stock)

    return {
      cartItems,
      loading: status === 'loading',
      error: status === 'error',
      totalUnits,
      subtotal,
      hasStockIssues,
      getQuantity: (productId) => cartItems.find((item) => item.product._id === productId)?.quantity || 0,
      isPending: (productId) => Boolean(pending[productId]),
      addToCart,
      updateQuantity,
      removeFromCart,
      refreshCart,
      syncCart: loadCart, // re-fetch quietly, e.g. after an order clears the cart
    }
  }, [cartItems, status, pending, addToCart, updateQuantity, removeFromCart, refreshCart, loadCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
