import { API_BASE_URL } from '../config/api';

const CURRENT_USER_KEY = 'terra_tern_current_user';
const AUTH_TOKEN_KEY = 'terra_tern_auth_token';

const normalizeUser = (user) => ({
  ...user,
  role: user?.role || 'user',
  accessStatus: user?.accessStatus || 'approved',
});

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    mode: 'cors',
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

export const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    return user ? normalizeUser(user) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user, token) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizeUser(user)));
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isAdmin = (user) => user?.role === 'admin';

export const refreshCurrentUser = async () => {
  if (!getAuthToken()) return null;
  const { user } = await requestJson('/api/auth/me');
  setCurrentUser(user);
  return normalizeUser(user);
};

export const registerUser = async ({ name, email, password }) => {
  try {
    const result = await requestJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (result.token) {
      setCurrentUser(result.user, result.token);
    }

    return { success: true, user: normalizeUser(result.user) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const result = await requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setCurrentUser(result.user, result.token);
    return { success: true, user: normalizeUser(result.user) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const logout = async () => {
  try {
    if (getAuthToken()) {
      await requestJson('/api/auth/logout', { method: 'POST' });
    }
  } catch {
    // Local cleanup still matters if the server is unavailable.
  } finally {
    clearCurrentUser();
  }
};

export const getUsers = async () => {
  const result = await requestJson('/api/admin/users');
  return result.users.map(normalizeUser);
};

export const deleteUserAccount = async () => {
  try {
    await requestJson('/api/auth/account', { method: 'DELETE' });
    clearCurrentUser();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserProfile = async ({ name, email, password }) => {
  try {
    const result = await requestJson('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email, password }),
    });

    setCurrentUser(result.user);
    return { success: true, user: normalizeUser(result.user) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createManagedUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const result = await requestJson('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    return { success: true, user: normalizeUser(result.user), users: result.users.map(normalizeUser) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserAccess = async ({ userId, accessStatus, role }) => {
  try {
    const result = await requestJson(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ accessStatus, role }),
    });

    const users = result.users.map(normalizeUser);
    const currentUser = getCurrentUser();
    const updatedCurrentUser = users.find((user) => user.id === currentUser?.id);
    if (updatedCurrentUser) {
      setCurrentUser(updatedCurrentUser);
    }

    return { success: true, users };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteManagedUser = async (userId) => {
  try {
    const result = await requestJson(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    return { success: true, users: result.users.map(normalizeUser) };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
