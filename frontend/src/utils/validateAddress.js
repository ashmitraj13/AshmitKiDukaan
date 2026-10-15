// Same rules as the backend. The server checks again; this just gives fast
// feedback and avoids a request that's certain to fail.
const validateAddress = (address) => {
  const errors = {}
  const value = (field) => address[field].trim() // whitespace-only counts as empty

  if (!value('fullName')) errors.fullName = 'Full name is required'
  if (!value('phone')) errors.phone = 'Phone number is required'
  else if (!/^[6-9]\d{9}$/.test(value('phone'))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (!value('addressLine1')) errors.addressLine1 = 'Address is required'
  if (!value('city')) errors.city = 'City is required'
  if (!value('state')) errors.state = 'State is required'
  if (!value('pincode')) errors.pincode = 'Pincode is required'
  else if (!/^[1-9]\d{5}$/.test(value('pincode'))) errors.pincode = 'Pincode must contain 6 digits'

  return errors
}

export default validateAddress
