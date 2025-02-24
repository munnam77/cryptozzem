import '@testing-library/jest-dom';

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

global.localStorage = localStorageMock;

// Mock IndexedDB for model persistence
const indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

global.indexedDB = indexedDB as any;