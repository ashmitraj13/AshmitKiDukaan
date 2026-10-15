const FIELDS = {
  fullName: "Full name",
  phone: "Phone number",
  addressLine1: "Address",
  city: "City",
  state: "State",
  pincode: "Pincode",
};

// Returns { address, errors }. address holds only the known fields, trimmed;
// errors maps field name -> message and is empty when everything is valid.
const validateShippingAddress = (input) => {
  const source = input && typeof input === "object" ? input : {};
  const address = {};
  const errors = {};

  for (const [field, label] of Object.entries(FIELDS)) {
    const value = typeof source[field] === "string" ? source[field].trim() : "";
    address[field] = value;
    // trim() first, so whitespace-only input counts as empty
    if (!value) errors[field] = `${label} is required`;
  }

  if (address.phone && !/^[6-9]\d{9}$/.test(address.phone)) {
    errors.phone = "Phone number must be a valid 10-digit mobile number";
  }

  if (address.pincode && !/^[1-9]\d{5}$/.test(address.pincode)) {
    errors.pincode = "Pincode must contain 6 digits";
  }

  return { address, errors };
};

export default validateShippingAddress;
