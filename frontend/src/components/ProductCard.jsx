import { Link } from 'react-router-dom'
import { formatPrice, stockStatus } from '../utils/format'
import WishlistButton from './WishlistButton'
import AddToCartButton from './AddToCartButton'
import ProductImage from './ProductImage'

function ProductCard({ product }) {
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
          <div className="card-actions-row">
            <Link to={`/products/${product._id}`} className="btn btn-outline">
              View Details
            </Link>
            <AddToCartButton product={product} />
          </div>
          <WishlistButton productId={product._id} />
        </div>
      </div>
    </article>
  )
}

export default ProductCard
