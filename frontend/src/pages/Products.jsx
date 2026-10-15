import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../services/api'
import ProductCard from '../components/ProductCard'
import SearchBar from '../components/SearchBar'

function Products() {
  // Filters live in the URL (/products?search=phone&category=Electronics),
  // so they survive a refresh and coming back from a details page
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''
  const queryKey = searchParams.toString()

  // What's typed in the box; copied into the URL after a short pause
  const [searchInput, setSearchInput] = useState(search)
  const debounceRef = useRef(null)

  // Which query the current result belongs to. If it doesn't match the URL,
  // a request for the new query is still in flight, i.e. we're loading.
  const [result, setResult] = useState({ key: null, products: [], error: false })
  const loading = result.key !== queryKey
  const { products, error } = result

  const updateParam = (key, value) => {
    // Read the live URL rather than a captured copy, since the debounced
    // search can fire after the category or sort has changed
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  // Debounce: only search 300ms after the user stops typing, not on every key
  const handleSearchChange = (value) => {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('search', value.trim()), 300)
  }

  // Don't let a pending search fire after leaving the page
  useEffect(() => {
    const ref = debounceRef
    return () => clearTimeout(ref.current)
  }, [])

  useEffect(() => {
    // Ignore responses from older requests that finish after a newer one
    let ignore = false

    getProducts({ search, category, sort })
      .then((res) => {
        if (!ignore) setResult({ key: queryKey, products: res.data.products, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ key: queryKey, products: [], error: true })
      })

    return () => {
      ignore = true
    }
  }, [queryKey, search, category, sort])

  const renderContent = () => {
    if (loading) return <div className="state">Loading products...</div>
    if (error) return <div className="state state-error">Something went wrong while loading products.</div>
    if (products.length === 0) return <div className="state">No products found.</div>

    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        {!loading && !error && (
          <span className="count">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      <SearchBar
        search={searchInput}
        category={category}
        sort={sort}
        onSearchChange={handleSearchChange}
        onCategoryChange={(value) => updateParam('category', value)}
        onSortChange={(value) => updateParam('sort', value)}
      />

      {renderContent()}
    </main>
  )
}

export default Products
