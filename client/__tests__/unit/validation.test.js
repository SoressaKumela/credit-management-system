
function validatePhone(phone) {
  const cleaned = phone.replace(/\s+/g, '');
  return /^(09\d{8}|\+2519\d{8})$/.test(cleaned);
}

describe('Frontend: validatePhone', () => {
  test('should_return_true_when_valid_09_phone', () => {
    expect(validatePhone('0911223344')).toBe(true);
  });

  test('should_return_true_when_valid_plus251_phone', () => {
    expect(validatePhone('+251911223344')).toBe(true);
  });

  test('should_return_true_when_phone_has_whitespace_padding', () => {
    expect(validatePhone('  0911223344  ')).toBe(true);
  });

  test('should_return_false_when_phone_empty', () => {
    expect(validatePhone('')).toBe(false);
  });

  test('should_return_false_when_phone_too_short', () => {
    expect(validatePhone('091122')).toBe(false);
  });

  test('should_return_false_when_phone_has_symbols', () => {
    expect(validatePhone('09!!@@##$$')).toBe(false);
  });

  test('should_return_false_when_phone_has_letters', () => {
    expect(validatePhone('091122abcd')).toBe(false);
  });

  test('should_return_false_when_wrong_prefix', () => {
    expect(validatePhone('0811223344')).toBe(false);
  });

  test('should_return_false_when_non_ethiopian_country_code', () => {
    expect(validatePhone('+1911223344')).toBe(false);
  });

  test('should_return_false_when_only_spaces', () => {
    expect(validatePhone('   ')).toBe(false);
  });
});
