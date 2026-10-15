import { useState } from 'react'

// Product photo that fills its box. Tall images (book covers, standing shoes)
// are shown whole instead of cropped, so titles and details aren't cut off.
function ProductImage({ src, alt, loading = 'lazy' }) {
  const [portrait, setPortrait] = useState(false)

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={portrait ? 'fit-contain' : undefined}
      onLoad={(e) => setPortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth)}
    />
  )
}

export default ProductImage
