const FIELDS = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel-national', inputMode: 'numeric', placeholder: '9876543210' },
  { name: 'addressLine1', label: 'Address', autoComplete: 'address-line1', placeholder: 'House no., street, area' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric', placeholder: '560001' },
]

// Presentational: the Checkout page owns the form state, because Place Order
// needs the values and the page decides when to submit
function CheckoutForm({ values, errors, onChange, disabled }) {
  return (
    <section className="card checkout-form">
      <h2>Shipping Details</h2>
      <div className="checkout-fields">
        {FIELDS.map(({ name, label, type = 'text', ...props }) => (
          <label key={name} className={`field field-${name}`}>
            <span>{label}</span>
            <input
              name={name}
              type={type}
              value={values[name]}
              onChange={onChange}
              disabled={disabled}
              className={errors[name] ? 'invalid' : ''}
              aria-invalid={Boolean(errors[name])}
              {...props}
            />
            {errors[name] && <small className="field-error">{errors[name]}</small>}
          </label>
        ))}
      </div>
    </section>
  )
}

export default CheckoutForm
