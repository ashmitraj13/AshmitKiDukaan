import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginCustomer } from '../services/api'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.registered

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    try {
      // The backend sets the HttpOnly cookie on this response; the browser stores it
      await loginCustomer(form)
      navigate('/home', { replace: true })
    } catch {
      setError('Invalid Credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="subtitle">Log in to your ShopKart account</p>

        {justRegistered && !error && (
          <div className="alert alert-success">Account created! Please log in.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Your password" />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>

        <p className="switch">
          New to ShopKart? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}

export default Login
