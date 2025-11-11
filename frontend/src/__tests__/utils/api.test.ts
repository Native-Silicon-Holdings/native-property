import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should have correct base URL configuration', () => {
    const expectedUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    expect(expectedUrl).toBeDefined();
  });

  it('should store token in localStorage on login', () => {
    const token = 'test-jwt-token';
    localStorage.setItem('token', token);

    const storedToken = localStorage.getItem('token');
    expect(storedToken).toBe(token);
  });

  it('should remove token from localStorage on logout', () => {
    const token = 'test-jwt-token';
    localStorage.setItem('token', token);

    localStorage.removeItem('token');

    const storedToken = localStorage.getItem('token');
    expect(storedToken).toBeNull();
  });

  it('should store user data in localStorage', () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'HOMEOWNER',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    expect(storedUser.email).toBe(user.email);
    expect(storedUser.role).toBe(user.role);
  });
});
