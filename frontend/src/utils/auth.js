const USER_STORAGE_KEY = 'terra_tern_users';
const CURRENT_USER_KEY = 'terra_tern_current_user';

const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const registerUser = ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { success: false, message: 'This email is already registered.' };
  }

  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    joined: new Date().toISOString(),
    profile: {
      displayName: name.trim(),
      email: normalizedEmail,
    },
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  return { success: true, user: newUser };
};

export const loginUser = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find((item) => item.email === normalizedEmail && item.password === password);
  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  setCurrentUser(user);
  return { success: true, user };
};

export const logout = () => {
  clearCurrentUser();
};

export const deleteUserAccount = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No user is logged in.' };
  }

  const users = loadUsers().filter((user) => user.id !== currentUser.id);
  saveUsers(users);
  clearCurrentUser();

  return { success: true };
};

export const updateUserProfile = ({ name, email, password }) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'No user is logged in.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const emailTaken = users.some((user) => user.email === normalizedEmail && user.id !== currentUser.id);
  if (emailTaken) {
    return { success: false, message: 'That email is already in use.' };
  }

  const updatedUser = {
    ...currentUser,
    name: name.trim(),
    email: normalizedEmail,
    password: password || currentUser.password,
    profile: {
      displayName: name.trim(),
      email: normalizedEmail,
    },
  };

  const updatedUsers = users.map((user) => (user.id === currentUser.id ? updatedUser : user));
  saveUsers(updatedUsers);
  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
};
