// Shared form validation helpers

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

// Keep only digits and cut to max length (blocks letters while typing)
export const onlyDigits = (value, max) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return max ? digits.slice(0, max) : digits;
};

// Keep only letters, spaces and . ' - (for names, city, state, etc.)
export const onlyLetters = (value) =>
  String(value ?? "").replace(/[^A-Za-z .'-]/g, "");

export const isValidEmail = (v) => EMAIL_RE.test(String(v).trim());
export const isValidPhone = (v) => PHONE_RE.test(String(v).trim());
export const isValidPincode = (v) => PINCODE_RE.test(String(v).trim());
export const isValidName = (v) => NAME_RE.test(String(v).trim());
export const isValidUrl = (v) => URL_RE.test(String(v).trim());

// Password: min 8 chars, at least one letter and one number
export const isStrongPassword = (v) =>
  String(v).length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

// Props to spread on a phone <input> so only 10 digits can be typed
export const phoneInputProps = {
  type: "tel",
  inputMode: "numeric",
  maxLength: 10,
  pattern: "[6-9][0-9]{9}",
  title: "Enter a valid 10-digit mobile number",
};
