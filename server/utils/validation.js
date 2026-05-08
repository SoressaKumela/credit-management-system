function validatePhone(phone) {
  const cleaned = phone.replace(/\s+/g, '');
  const ethiopianRegex = /^(09\d{8}|\+2519\d{8})$/;
  return ethiopianRegex.test(cleaned);
}

function normalizePhone(phone) {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+251')) {
    return '0' + cleaned.slice(4);
  }
  return cleaned;
}

module.exports = { validatePhone, normalizePhone };
