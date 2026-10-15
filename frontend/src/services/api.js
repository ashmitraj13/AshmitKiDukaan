import axios from 'axios'

const api = axios.create({
  baseURL: '/api', // proxied to http://localhost:8000 by vite.config.js
  withCredentials: true, // send and accept the HttpOnly auth cookie
})

// Customers
export const registerCustomer = (data) => api.post('/customers/register', data)

export const loginCustomer = (credentials) => api.post('/customers/login', credentials)

export const getMe = () => api.get('/customers/me')

export const logoutCustomer = () => api.post('/customers/logout')

// Products
// params: { search, category, sort }; empty values are dropped so the URL stays clean
export const getProducts = (params = {}) => {
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value))
  return api.get('/products', { params: query })
}

export const getProductById = (id) => api.get(`/products/${id}`)

// Wishlist: the user comes from the cookie, so no userId is ever sent
export const getWishlist = () => api.get('/wishlist')

export const getWishlistIds = () => api.get('/wishlist/ids')

export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`)

export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)

// Cart: every call returns the full updated cart, so state can be replaced as-is
export const getCart = () => api.get('/cart')

export const addToCart = (productId) => api.post(`/cart/${productId}`)

export const updateCartQuantity = (productId, quantity) => api.patch(`/cart/${productId}`, { quantity })

export const removeFromCart = (productId) => api.delete(`/cart/${productId}`)

// Orders: only the shipping address is sent; the server builds items and total
export const createPaymentOrder = (shippingAddress) =>
  api.post('/orders/create-payment-order', { shippingAddress })

export const verifyPayment = (payment) => api.post('/orders/verify-payment', payment)

export const getOrders = () => api.get('/orders')

export const getOrderById = (id) => api.get(`/orders/${id}`)

// Bonus, development only
export const advanceOrderStatus = (id) => api.patch(`/orders/${id}/advance-status`)

// Pulls the backend's { message } out of an axios error, with a fallback
export const getErrorMessage = (error, fallback = 'Something went wrong') =>
  error.response?.data?.message || fallback

export default api
