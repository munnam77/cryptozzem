export interface EncryptedData {
  iv: string;
  data: string;
}

export class SecureStorage {
  private static instance: SecureStorage;
  private key: CryptoKey | null = null;
  private readonly salt = new Uint8Array([21, 87, 156, 123, 189, 234, 12, 66, 98, 33, 148, 91, 44, 77, 167, 203]);
  private prefix = 'crypto_zzem_';
  private encryptionKey: CryptoKey | null = null;

  private constructor() {
    this.initializeEncryption();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  async initialize(masterPassword: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async initializeEncryption() {
    // Generate or retrieve encryption key
    const keyMaterial = await this.getKeyMaterial();
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('crypto_zzem_salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async getKeyMaterial(): Promise<CryptoKey> {
    const deviceId = await this.getDeviceId();
    return crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(deviceId),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
  }

  private async getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem(`${this.prefix}device_id`);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(`${this.prefix}device_id`, deviceId);
    }
    return deviceId;
  }

  async encrypt(data: string): Promise<EncryptedData> {
    if (!this.key) {
      throw new Error('SecureStorage not initialized');
    }

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.key,
      encoder.encode(data)
    );

    return {
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encryptedData))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.key) {
      throw new Error('SecureStorage not initialized');
    }

    const iv = new Uint8Array(
      encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    const data = new Uint8Array(
      encryptedData.data.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  }

  async encryptObject(obj: any): Promise<EncryptedData> {
    return this.encrypt(JSON.stringify(obj));
  }

  async decryptObject<T>(encryptedData: EncryptedData): Promise<T> {
    const decrypted = await this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedValue = new TextEncoder().encode(value);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey!,
      encodedValue
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const combinedArray = new Uint8Array(iv.length + encryptedArray.length);
    combinedArray.set(iv);
    combinedArray.set(encryptedArray, iv.length);

    const base64Data = btoa(String.fromCharCode(...combinedArray));
    localStorage.setItem(`${this.prefix}${key}`, base64Data);
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    const encryptedData = localStorage.getItem(`${this.prefix}${key}`);
    if (!encryptedData) return null;

    try {
      const combinedArray = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );

      const iv = combinedArray.slice(0, 12);
      const data = combinedArray.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.encryptionKey!,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (err) {
      console.error('Failed to decrypt data:', err);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const secureStorage = SecureStorage.getInstance();