// ============================================================
// AUTH SERVICE — JWT token management
// ============================================================

const TOKEN_KEY = 'hospital_jwt_token';
const USER_KEY = 'hospital_user';

export interface AuthUser {
  user_id: string;
  username: string;
  name: string;
  role: string;
  department: string;
}

export const authService = {
  // Get the stored JWT token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get the stored user info
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Store token and user info after login
  setAuth(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Clear auth data on logout
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired by decoding the JWT payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  },

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  },
};
