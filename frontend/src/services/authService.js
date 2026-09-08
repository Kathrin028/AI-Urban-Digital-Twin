import { fetchApi } from './api';

const TOKEN_KEY = 'urbanmind_token';

/** Save token. */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * login – authenticate with email + password against FastAPI backend.
 *
 * @returns {Promise<{user: object}>}
 */
export async function login({ email, password }) {
  if (!email || !password) {
    return Promise.reject(new Error('Email and password are required.'));
  }

  try {
    const data = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.access_token) {
      saveToken(data.access_token);
      return { user: data.user };
    }
    
    return Promise.reject(new Error('Failed to retrieve access token.'));
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * register – create a new user account via FastAPI.
 *
 * @returns {Promise<{user: object}>}
 */
export async function register({ name, email, password, phone, city }) {
  if (!name || !email || !password) {
    return Promise.reject(new Error('Name, email, and password are required.'));
  }

  try {
    await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, city }),
    });

    // Registration returns user schema. We don't auto-login here since the original didn't generate JWT on register, 
    // actually wait, the original mock did auto-login. The user says: 
    // "Prefer redirecting to Login unless the existing architecture intentionally logs the user in automatically."
    // Let's check original mock: `const user = saveSession(safeFound); return { user };` It auto-logged in.
    // However, FastAPI doesn't return JWT on register. It returns UserResponse.
    // So we'll have to either auto-login by calling login(), or just return user and let the UI handle it.
    // Let's auto-login to match original mock behavior, or just return user.
    // Actually, I'll auto-login to match exact original behavior.
    const loginData = await login({ email, password });
    return loginData;
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * logout – clear the active session.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  clearToken();
  // Clear any other auth specific local storage if needed, but not complaints
}

/**
 * getCurrentUser – restore session from FastAPI on page load using JWT.
 *
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const user = await fetchApi('/api/auth/me', {
      method: 'GET',
    });
    return user;
  } catch (error) {
    // Only clear token if the backend explicitly rejected it (e.g. 401 Unauthorized)
    // Avoid clearing on generic network errors or 500s to preserve session resilience
    const msg = error?.message?.toLowerCase() || '';
    if (
      msg.includes('credentials') || 
      msg.includes('authenticated') || 
      msg.includes('inactive')
    ) {
      clearToken();
    }
    return null;
  }
}
