export const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home']

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatPrice = (price) => rupees.format(price)

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// Last 8 characters of a MongoDB id, for display ("Order #36DC5BE0")
export const shortId = (id) => id.slice(-8).toUpperCase()

// Returns the label and a CSS modifier for the stock badge
export const stockStatus = (stock) => {
  if (stock === 0) return { label: 'Out of stock', tone: 'out' }
  if (stock <= 5) return { label: `Only ${stock} left`, tone: 'low' }
  return { label: `${stock} units left`, tone: 'in' }
}
