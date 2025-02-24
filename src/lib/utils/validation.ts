interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Include at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Include at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Include at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Include at least one special character');
  }
  
  // Check for common patterns
  const commonPatterns = [
    '123456', 'password', 'qwerty', 'abc123',
    'admin', '111111', '12345678', 'password1'
  ];
  
  if (commonPatterns.some(pattern => 
    password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common unsafe patterns');
  }
  
  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid repeating characters more than twice');
  }
  
  // Check for keyboard patterns
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx'
  ];
  
  if (keyboardPatterns.some(pattern => 
    password.toLowerCase().includes(pattern))) {
    errors.push('Avoid keyboard patterns');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}