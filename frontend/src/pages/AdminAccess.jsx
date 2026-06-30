import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from '../utils/motion';
import { CheckCircle, Search, ShieldCheck, Trash2, UserPlus, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { createManagedUser, deleteManagedUser, getUsers, updateUserAccess } from '../utils/auth';

const emptyForm = {
  name: '',
  email: '',
  password: '',
};

const AdminAccess = ({ currentUser, onUpdateUser }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = useCallback((updatedUsers) => {
    setUsers(updatedUsers);
    const freshCurrentUser = updatedUsers.find((user) => user.id === currentUser?.id);
    if (freshCurrentUser && onUpdateUser) {
      onUpdateUser(freshCurrentUser);
    }
  }, [currentUser?.id, onUpdateUser]);

  useEffect(() => {
    let isMounted = true;

    const loadAdminUsers = async () => {
      try {
        const loadedUsers = await getUsers();
        if (isMounted) {
          refreshUsers(loadedUsers);
        }
      } catch (error) {
        toast.error(error.message || 'Unable to load users');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAdminUsers();

    return () => {
      isMounted = false;
    };
  }, [refreshUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => (
      `${user.name} ${user.email} ${user.role} ${user.accessStatus}`.toLowerCase().includes(query)
    ));
  }, [searchQuery, users]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (role) => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email, and password are required.');
      return;
    }

    const result = await createManagedUser({ ...form, role });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setForm(emptyForm);
    refreshUsers(result.users);
    toast.success(role === 'admin' ? 'Admin added with access' : 'User added with access');
  };

  const handleAccessUpdate = async (userId, accessStatus, role) => {
    const result = await updateUserAccess({ userId, accessStatus, role });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    refreshUsers(result.users);
    toast.success('Access updated');
  };

  const handleDelete = async (userId) => {
    const result = await deleteManagedUser(userId);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    refreshUsers(result.users);
    toast.success('User removed');
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Admin Access</h1>
        <p className="text-gray-400">Approve users, add admins, and control who can log in.</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10 xl:col-span-1"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Add Access</h2>
              <p className="text-sm text-gray-400">Create an approved account directly.</p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={form.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleFormChange('email', event.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => handleFormChange('password', event.target.value)}
              placeholder="Temporary password"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCreateUser('user')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-400"
              >
                <UserPlus size={18} />
                Add User
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCreateUser('admin')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400"
              >
                <ShieldCheck size={18} />
                Add Admin
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10 xl:col-span-2"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Users</h2>
              <p className="text-sm text-gray-400 mt-1">{users.length} account records in temporary storage.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="py-10 text-center text-gray-400">
                Loading users...
              </div>
            )}

            {!isLoading && filteredUsers.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-white font-semibold truncate">{user.name}</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {user.role}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.accessStatus === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {user.accessStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mt-1">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user.accessStatus !== 'approved' && (
                      <button
                        onClick={() => handleAccessUpdate(user.id, 'approved')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 text-green-300 hover:bg-green-500/25 text-sm"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                    {user.accessStatus === 'approved' && !isSelf && (
                      <button
                        onClick={() => handleAccessUpdate(user.id, 'pending')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/25 text-sm"
                      >
                        <XCircle size={16} />
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => handleAccessUpdate(user.id, undefined, user.role === 'admin' ? 'user' : 'admin')}
                      disabled={isSelf}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-gray-200 hover:bg-white/15 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShieldCheck size={16} />
                      {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={isSelf}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {!isLoading && filteredUsers.length === 0 && (
              <div className="py-10 text-center text-gray-400">
                No users match your search.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAccess;
