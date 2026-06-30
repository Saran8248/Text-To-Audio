import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '../utils/motion';
import { Bell, Moon, Sun, Lock, Mail, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { deleteUserAccount, getCurrentUser, updateUserProfile } from '../utils/auth';

const Settings = ({ user, onUpdateUser, theme, onThemeChange, onLogout }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: theme || localStorage.getItem('terra_tern_theme') || 'dark',
    notifications: true,
    emailUpdates: false,
    twoFactor: false,
    defaultVoice: 'en-US-JennyNeural',
    defaultSpeed: 1,
  });
  const [profile, setProfile] = useState({
    email: '',
    name: '',
  });

  useEffect(() => {
    const currentUser = user || getCurrentUser();
    if (currentUser) {
      setProfile({
        email: currentUser.email,
        name: currentUser.name || currentUser.profile?.displayName || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (theme) {
      setSettings((prev) => ({ ...prev, theme }));
    }
  }, [theme]);

  const handleThemeChange = (themeValue) => {
    setSettings((prev) => ({ ...prev, theme: themeValue }));
    if (onThemeChange) {
      onThemeChange(themeValue);
    }
    localStorage.setItem('terra_tern_theme', themeValue);
    toast.success(`${themeValue === 'dark' ? 'Dark' : 'Light'} theme enabled`);
  };

  const handlePasswordChange = () => {
    const newPassword = window.prompt('Enter a new password');
    if (!newPassword) {
      return;
    }

    const result = updateUserProfile({ name: profile.name, email: profile.email, password: newPassword });
    if (result.success) {
      toast.success('Password updated successfully');
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || 'Unable to update password');
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('This will permanently delete your account. Continue?')) {
      return;
    }

    const result = deleteUserAccount();
    if (result.success) {
      toast.success('Account deleted successfully');
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    } else {
      toast.error(result.message || 'Unable to delete account');
    }
  };

  const handleProfileSave = () => {
    const result = updateUserProfile({
      name: profile.name,
      email: profile.email,
    });

    if (result.success) {
      toast.success('Profile updated');
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || 'Unable to save profile');
    }
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    toast.success('Setting updated');
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    toast.success('Setting updated');
  };

  const SettingToggle = ({ icon: Icon, label, description, value, onChange }) => (
    <div className="flex items-center justify-between p-4 glass-sm rounded-lg border border-white/5 hover:border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="font-medium text-white">{label}</p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? 'bg-blue-500' : 'bg-gray-600'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ x: value ? 24 : 4 }}
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
        />
      </motion.button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and application settings</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleProfileSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg"
          >
            Save Changes
          </motion.button>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Preferences</h3>
        <div className="space-y-4">
          {/* Default Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Voice</label>
            <select
              value={settings.defaultVoice}
              onChange={(e) => handleChange('defaultVoice', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="en-US-JennyNeural">Jenny (English US Female)</option>
              <option value="en-US-GuyNeural">Guy (English US Male)</option>
              <option value="en-US-AriaNeural">Aria (English US Female)</option>
              <option value="en-US-EricNeural">Eric (English US Male)</option>
              <option value="en-US-BrianNeural">Brian (English US Male)</option>
              <option value="en-US-ChristopherNeural">Christopher (English US Male)</option>
              <option value="en-GB-SoniaNeural">Sonia (English UK Female)</option>
              <option value="en-GB-RyanNeural">Ryan (English UK Male)</option>
              <option value="en-GB-LibbyNeural">Libby (English UK Female)</option>
              <option value="en-GB-MaisieNeural">Maisie (English UK Female)</option>
              <option value="en-GB-ThomasNeural">Thomas (English UK Male)</option>
              <option value="en-AU-NatashaNeural">Natasha (English AU Female)</option>
              <option value="en-AU-WilliamMultilingualNeural">William (English AU Male)</option>
              <option value="de-DE-KatjaNeural">Katja (German Female)</option>
              <option value="de-DE-ConradNeural">Conrad (German Male)</option>
              <option value="de-DE-AmalaNeural">Amala (German Female)</option>
              <option value="de-DE-FlorianMultilingualNeural">Florian (German Male)</option>
              <option value="de-DE-KillianNeural">Killian (German Male)</option>
              <option value="de-DE-SeraphinaMultilingualNeural">Seraphina (German Female)</option>
              <option value="fr-FR-DeniseNeural">Denise (French Female)</option>
              <option value="fr-FR-HenriNeural">Henri (French Male)</option>
              <option value="fr-FR-EloiseNeural">Eloise (French Female)</option>
              <option value="fr-FR-RemyMultilingualNeural">Remy (French Male)</option>
              <option value="fr-FR-VivienneMultilingualNeural">Vivienne (French Female)</option>
              <option value="ja-JP-NanamiNeural">Nanami (Japanese Female)</option>
              <option value="ja-JP-KeitaNeural">Keita (Japanese Male)</option>
              <option value="uk-UA-PolinaNeural">Polina (Ukrainian Female)</option>
              <option value="uk-UA-OstapNeural">Ostap (Ukrainian Male)</option>
              <option value="hi-IN-SwaraNeural">Swara (Hindi Female)</option>
              <option value="hi-IN-MadhurNeural">Madhur (Hindi Male)</option>
            </select>
          </div>

          {/* Default Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Speed</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.defaultSpeed}
                onChange={(e) => handleChange('defaultSpeed', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-sm font-medium text-blue-400 min-w-12">{settings.defaultSpeed.toFixed(2)}x</span>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
            <div className="flex gap-3">
              <motion.button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Moon size={18} />
                Dark
              </motion.button>
              <motion.button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Sun size={18} />
                Light
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Notifications</h3>
        <div className="space-y-4">
          <SettingToggle
            icon={Bell}
            label="Push Notifications"
            description="Receive notifications about audio generation and API updates"
            value={settings.notifications}
            onChange={() => handleToggle('notifications')}
          />
          <SettingToggle
            icon={Mail}
            label="Email Updates"
            description="Get email notifications about new features and updates"
            value={settings.emailUpdates}
            onChange={() => handleToggle('emailUpdates')}
          />
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Security</h3>
        <div className="space-y-4">
          <SettingToggle
            icon={Lock}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            value={settings.twoFactor}
            onChange={() => handleToggle('twoFactor')}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePasswordChange}
            className="w-full px-6 py-3 border border-white/10 rounded-lg font-medium text-white hover:bg-white/5 transition-colors"
          >
            <Eye size={18} className="inline mr-2" />
            Change Password
          </motion.button>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/5"
      >
        <h3 className="text-xl font-semibold text-red-400 mb-6">Danger Zone</h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDeleteAccount}
          className="px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-lg font-medium text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Delete Account
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Settings;
