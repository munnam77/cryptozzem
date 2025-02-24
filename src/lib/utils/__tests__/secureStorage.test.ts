import { SecureStorage } from '../secureStorage';

describe('SecureStorage', () => {
  let secureStorage: SecureStorage;
  const testKey = 'test_key';
  const testValue = 'test_value';

  beforeEach(() => {
    localStorage.clear();
    secureStorage = SecureStorage.getInstance();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('getInstance returns singleton instance', () => {
    const instance1 = SecureStorage.getInstance();
    const instance2 = SecureStorage.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('stores and retrieves encrypted data', async () => {
    await secureStorage.setItem(testKey, testValue);
    const retrieved = await secureStorage.getItem(testKey);
    expect(retrieved).toBe(testValue);
  });

  test('stored data is encrypted', async () => {
    await secureStorage.setItem(testKey, testValue);
    const rawData = localStorage.getItem('crypto_zzem_test_key');
    
    // Verify data is base64 encoded and encrypted
    expect(rawData).toBeTruthy();
    expect(rawData).not.toBe(testValue);
    expect(rawData).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test('handles complex data types', async () => {
    const complexData = {
      number: 123,
      string: 'test',
      boolean: true,
      array: [1, 2, 3],
      nested: { key: 'value' }
    };

    await secureStorage.setItem(testKey, JSON.stringify(complexData));
    const retrieved = await secureStorage.getItem(testKey);
    expect(JSON.parse(retrieved!)).toEqual(complexData);
  });

  test('returns null for non-existent keys', async () => {
    const value = await secureStorage.getItem('nonexistent');
    expect(value).toBeNull();
  });

  test('removes items correctly', async () => {
    await secureStorage.setItem(testKey, testValue);
    secureStorage.removeItem(testKey);
    const value = await secureStorage.getItem(testKey);
    expect(value).toBeNull();
  });

  test('clears all stored items', async () => {
    await secureStorage.setItem('key1', 'value1');
    await secureStorage.setItem('key2', 'value2');
    
    secureStorage.clear();
    
    const value1 = await secureStorage.getItem('key1');
    const value2 = await secureStorage.getItem('key2');
    expect(value1).toBeNull();
    expect(value2).toBeNull();
  });

  test('maintains encryption across page reloads', async () => {
    await secureStorage.setItem(testKey, testValue);
    
    // Simulate page reload by creating new instance
    const newStorage = SecureStorage.getInstance();
    const retrieved = await newStorage.getItem(testKey);
    expect(retrieved).toBe(testValue);
  });

  test('handles concurrent operations', async () => {
    const operations = Array(5).fill(null).map((_, i) => 
      secureStorage.setItem(`key${i}`, `value${i}`)
    );
    
    await Promise.all(operations);
    
    for (let i = 0; i < 5; i++) {
      const value = await secureStorage.getItem(`key${i}`);
      expect(value).toBe(`value${i}`);
    }
  });

  test('maintains data integrity', async () => {
    const largeData = 'x'.repeat(10000);
    await secureStorage.setItem(testKey, largeData);
    const retrieved = await secureStorage.getItem(testKey);
    expect(retrieved).toBe(largeData);
  });

  test('handles utf-8 characters', async () => {
    const utf8Data = '🔒 안녕하세요 привет こんにちは';
    await secureStorage.setItem(testKey, utf8Data);
    const retrieved = await secureStorage.getItem(testKey);
    expect(retrieved).toBe(utf8Data);
  });

  test('handles tampered data', async () => {
    await secureStorage.setItem(testKey, testValue);
    
    // Tamper with stored data
    const storedData = localStorage.getItem('crypto_zzem_test_key')!;
    localStorage.setItem('crypto_zzem_test_key', storedData.slice(1));
    
    const retrieved = await secureStorage.getItem(testKey);
    expect(retrieved).toBeNull();
  });
});