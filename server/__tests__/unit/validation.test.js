const { validatePhone, normalizePhone } = require('../../utils/validation');

describe('validatePhone', () => {
  test('should_return_true_when_valid_09_format', () => {
    const phone = '0911223344';
    const result = validatePhone(phone);
    expect(result).toBe(true);
  });

  test('should_return_true_when_valid_plus251_format', () => {
    const phone = '+251911223344';
    const result = validatePhone(phone);
    expect(result).toBe(true);
  });

  test('should_return_true_when_phone_has_whitespace', () => {
    const phone = '  0911223344  ';
    const result = validatePhone(phone);
    expect(result).toBe(true);
  });

  test('should_return_false_when_phone_too_short', () => {
    const phone = '091122';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_too_long', () => {
    const phone = '091122334455';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_has_letters', () => {
    const phone = '091122abcd';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_has_special_characters', () => {
    const phone = '09!!@@##$$';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_empty', () => {
    const phone = '';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_does_not_start_with_09', () => {
    const phone = '0811223344';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });

  test('should_return_false_when_phone_has_wrong_country_code', () => {
    const phone = '+252911223344';
    const result = validatePhone(phone);
    expect(result).toBe(false);
  });
});

describe('normalizePhone', () => {
  test('should_convert_plus251_to_09_format', () => {
    const phone = '+251911223344';
    const result = normalizePhone(phone);
    expect(result).toBe('0911223344');
  });

  test('should_keep_09_format_unchanged', () => {
    const phone = '0911223344';
    const result = normalizePhone(phone);
    expect(result).toBe('0911223344');
  });

  test('should_strip_whitespace_from_phone', () => {
    const phone = '  0911223344  ';
    const result = normalizePhone(phone);
    expect(result).toBe('0911223344');
  });

  test('should_strip_internal_whitespace', () => {
    const phone = '091 122 3344';
    const result = normalizePhone(phone);
    expect(result).toBe('0911223344');
  });
});
