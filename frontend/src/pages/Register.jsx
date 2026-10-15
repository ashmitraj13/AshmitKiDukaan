import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerCustomer, getErrorMessage } from '../services/api'

const initialForm = { fullName: '', email: '', password: '', phone: '' }

const validate = ({ fullName, email, password, phone }) => {
  const errors = {}
  if (!fullName.trim()) errors.fullName = 'Full name is required'
  if (!email.trim()) errors.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email'
  if (!password) errors.password = 'Password is required'
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
  if (!phone.trim()) errors.phone = 'Phone number is required'
  else if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Enter a 10-digit phone number'
  return errors
}

function Register() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await registerCustomer(form)
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="subtitle">Join ShopKart and start shopping</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} placeholder="John Doe" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="At least 6 characters" />
        <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="9876543210" />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}

function Field({ label, name, error, type = 'text', ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} className={error ? 'invalid' : ''} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export default Register
