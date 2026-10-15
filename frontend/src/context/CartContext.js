import { createContext } from 'react'

// Holds the shared cart state; provided by CartProvider, read with useCart()
const CartContext = createContext(null)

export default CartContext
