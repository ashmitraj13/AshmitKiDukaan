import { Link } from 'react-router-dom'
import { formatPrice, stockStatus } from '../utils/format'
import ProductImage from './ProductImage'

function WishlistCard({ product, removing, error, onRemove }) {
  const stock = stockStatus(product.stock)

  return (
    <article className="product-card">
      <div className="product-image">
        <ProductImage src={product.image} alt={product.name} />
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <span className="category">{product.category}</span>
        <p className="price">{formatPrice(product.price)}</p>
        <span className={`stock stock-${stock.tone}`}>{stock.label}</span>
        <div className="card-actions">
          <Link to={`/products/${product._id}`} className="btn btn-primary">
            View Details
          </Link>
          <button
            type="button"
            className="btn btn-wishlist is-saved"
            onClick={() => onRemove(product._id)}
            disabled={removing}
          >
            {removing ? '⏳ Removing...' : '♥ Remove from Wishlist'}
          </button>
          {error && (
            <small className="field-error" role="alert">
              {error}
            </small>
          )}
        </div>
      </div>
    </article>
  )
}

export default WishlistCard
