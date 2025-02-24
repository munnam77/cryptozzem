import { validatePassword } from '../validation';

describe('Password Validation', () => {
  test('accepts strong passwords', () => {
    const strongPassword = 'P@ssw0rd123!';
    const result = validatePassword(strongPassword);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires minimum length', () => {
    const shortPassword = 'Abc123!';
    const result = validatePassword(shortPassword);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  test('requires uppercase letter', () => {
    const noUppercase = 'password123!';
    const result = validatePassword(noUppercase);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Include at least one uppercase letter');
  });

  test('requires lowercase letter', () => {
    const noLowercase = 'PASSWORD123!';
    const result = validatePassword(noLowercase);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Include at least one lowercase letter');
  });

  test('requires number', () => {
    const noNumber = 'Password!';
    const result = validatePassword(noNumber);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Include at least one number');
  });

  test('requires special character', () => {
    const noSpecial = 'Password123';
    const result = validatePassword(noSpecial);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Include at least one special character');
  });

  test('detects common patterns', () => {
    const commonPasswords = ['Password123!', 'Admin123!', 'Qwerty123!'];
    commonPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains common unsafe patterns');
    });
  });

  test('detects repeated characters', () => {
    const repeatedChars = 'Paaa123!';
    const result = validatePassword(repeatedChars);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Avoid repeating characters more than twice');
  });

  test('detects keyboard patterns', () => {
    const keyboardPatterns = ['Qwerty123!', 'Asdfgh123!'];
    keyboardPatterns.forEach(password => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Avoid keyboard patterns');
    });
  });

  test('handles empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validates complex passwords', () => {
    const complexPasswords = [
      'K9$mP2#vL5nX',
      'Tr@ff1c-L1ght',
      'Bl@ckB3rry99',
      'C0ff33-Br3@k!'
    ];

    complexPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});