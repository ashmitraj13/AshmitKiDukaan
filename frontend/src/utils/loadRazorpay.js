const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let loading = null

// Loads Razorpay Checkout once. Resolves true when window.Razorpay is ready,
// false if the script couldn't load (offline, blocked by an ad blocker, ...)
const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true)

  if (!loading) {
    loading = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.onload = () => resolve(Boolean(window.Razorpay))
      script.onerror = () => {
        script.remove()
        loading = null // allow a retry on the next click
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }
  return loading
}

export default loadRazorpay
