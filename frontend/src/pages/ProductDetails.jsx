import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProductById, getErrorMessage } from '../services/api'
import { formatPrice, stockStatus } from '../utils/format'
import WishlistButton from '../components/WishlistButton'
import AddToCartButton from '../components/AddToCartButton'
import ProductImage from '../components/ProductImage'

function ProductDetails() {
  const { id } = useParams() // the :id part of /products/:id
  const navigate = useNavigate()

  // Which id the current result belongs to; a mismatch means we're loading
  const [result, setResult] = useState({ id: null, product: null, error: '' })
  const loading = result.id !== id
  const { product, error } = result

  useEffect(() => {
    let ignore = false

    getProductById(id)
      .then((res) => {
        if (!ignore) setResult({ id, product: res.data.product, error: '' })
      })
      .catch((err) => {
        const message = getErrorMessage(err, 'Something went wrong while loading the product.')
        if (!ignore) setResult({ id, product: null, error: message })
      })

    return () => {
      ignore = true
    }
  }, [id])

  if (loading) return <div className="state">Loading product...</div>

  if (error) {
    return (
      <div className="state state-error">
        <p>{error}</p>
        <Link to="/products">← Back to products</Link>
      </div>
    )
  }

  const stock = stockStatus(product.stock)

  return (
    <main className="details-page">
      {/* navigate(-1) keeps the search/filter the user came from */}
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="details card">
        <div className="details-image">
          <ProductImage src={product.image} alt={product.name} loading="eager" />
        </div>

        <div className="details-info">
          <span className="category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="price price-lg">{formatPrice(product.price)}</p>
          <span className={`stock stock-${stock.tone}`}>{stock.label}</span>
          <p className="description">{product.description}</p>

          <AddToCartButton product={product} />
          {/* key: start fresh if the route moves to a different product */}
          <WishlistButton key={product._id} productId={product._id} />
        </div>
      </div>
    </main>
  )
}

export default ProductDetails
