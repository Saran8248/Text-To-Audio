import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '../utils/motion';
import { Bell, Moon, Sun, Lock, Mail, Eye, EyeOff, User, Camera, Shield, HelpCircle, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { deleteUserAccount, getCurrentUser, updateUserProfile } from '../utils/auth';

const Settings = ({ user, onUpdateUser, theme, onThemeChange, onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    avatarUrl: '',
  });

  // Password change state
  const [passwordState, setPasswordState] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Customer support state
  const [supportState, setSupportState] = useState({
    subject: '',
    message: '',
  });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  useEffect(() => {
    const currentUser = user || getCurrentUser();
    if (currentUser) {
      setProfile({
        email: currentUser.email,
        name: currentUser.name || currentUser.profile?.displayName || '',
        avatarUrl: currentUser.profile?.avatarUrl || '',
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

  // Profile Picture Upload Handler
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
      toast.info('Profile picture selected. Click "Save Profile" to apply changes.');
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (!profile.email.trim()) {
      toast.error('Email cannot be empty');
      return;
    }

    const result = await updateUserProfile({
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });

    if (result.success) {
      toast.success('Profile updated successfully');
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || 'Unable to save profile');
    }
  };

  // Password Update Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordState.newPassword) {
      toast.error('Password cannot be empty');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = await updateUserProfile({
      name: profile.name,
      email: profile.email,
      password: passwordState.newPassword,
    });

    if (result.success) {
      toast.success('Password updated successfully');
      setPasswordState({ newPassword: '', confirmPassword: '' });
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || 'Unable to update password');
    }
  };

  // Customer Support Handler
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportState.subject.trim() || !supportState.message.trim()) {
      toast.error('Please fill in all support fields');
      return;
    }

    setIsSubmittingSupport(true);

    // Simulate sending support request
    setTimeout(() => {
      setIsSubmittingSupport(false);
      toast.success('Support request sent! We will contact you at your registered email shortly.');
      setSupportState({ subject: '', message: '' });
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account. Continue?')) {
      return;
    }

    const result = await deleteUserAccount();
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

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    toast.success('Setting updated');
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    toast.success('Setting updated');
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your profile, preferences, security, and contact support</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <User className="text-blue-400" size={22} />
          Profile Settings
        </h3>
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-6">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={handleAvatarClick}
              className="relative w-32 h-32 rounded-full border-2 border-white/10 bg-white/5 overflow-hidden group cursor-pointer hover:border-blue-400 transition-all flex items-center justify-center"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-300">{getInitials(profile.name)}</span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <Camera size={20} />
                <span className="text-xs">Change</span>
              </div>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500">Max size: 2MB (JPG/PNG)</p>
          </div>

          {/* Profile Form Details */}
          <div className="flex-1 space-y-4 w-full">
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg"
            >
              Save Profile
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Security & Password Changing (Professional Form) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Shield className="text-blue-400" size={22} />
          Security & Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg"
          >
            Update Password
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <SettingToggle
            icon={Lock}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            value={settings.twoFactor}
            onChange={() => handleToggle('twoFactor')}
          />
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
              <option value="en-GB-LibbyNeural">Libby (English UK Female)</option>
              <option value="en-GB-MaisieNeural">Maisie (English UK Female)</option>
              <option value="en-GB-PoppyNeural">Poppy (English UK Female)</option>
              <option value="en-GB-RyanNeural">Ryan (English UK Male)</option>
              <option value="en-GB-ThomasNeural">Thomas (English UK Male)</option>
              <option value="en-GB-OliverNeural">Oliver (English UK Male)</option>
              <option value="en-GB-JamesNeural">James (English UK Male)</option>
              <option value="en-AU-NatashaNeural">Natasha (English AU Female)</option>
              <option value="en-AU-WilliamMultilingualNeural">William (English AU Male)</option>
              <option value="de-DE-KatjaNeural">Katja (German Female - Soft)</option>
              <option value="de-DE-ConradNeural">Conrad (German Male - Clear)</option>
              <option value="de-DE-AmalaNeural">Amala (German Female - Warm)</option>
              <option value="de-DE-FlorianMultilingualNeural">Florian (German Male - Bold)</option>
              <option value="de-DE-KillianNeural">Killian (German Male - Bright)</option>
              <option value="de-DE-SeraphinaMultilingualNeural">Seraphina (German Female - Clear)</option>
              <option value="de-AT-IngridNeural">Ingrid (German Austria Female - Friendly)</option>
              <option value="de-AT-JonasNeural">Jonas (German Austria Male - Friendly)</option>
              <option value="de-CH-LeniNeural">Leni (German Switzerland Female - Soft)</option>
              <option value="de-CH-JanNeural">Jan (German Switzerland Male - Clear)</option>
              <option value="fr-FR-DeniseNeural">Denise (French Female)</option>
              <option value="fr-FR-HenriNeural">Henri (French Male)</option>
              <option value="fr-FR-EloiseNeural">Eloise (French Female)</option>
              <option value="fr-FR-RemyMultilingualNeural">Remy (French Male)</option>
              <option value="fr-FR-VivienneMultilingualNeural">Vivienne (French Female)</option>
              <option value="ja-JP-NanamiNeural">Nanami (Japanese Female)</option>
              <option value="ja-JP-KeitaNeural">Keita (Japanese Male)</option>
              <option value="uk-UA-PolinaNeural">Polina (Ukrainian Female)</option>
              <option value="uk-UA-OstapNeural">Ostap (Ukrainian Male)</option>
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

      {/* Help & Customer Support (Contact Support) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <HelpCircle className="text-blue-400" size={22} />
          Customer Support
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Support Details */}
          <div className="md:col-span-1 space-y-4 text-gray-400 text-sm">
            <p>Have questions or running into issues? Send a direct message to our support team.</p>
            <div className="pt-2">
              <span className="font-medium text-white block">Email Support</span>
              <a href="mailto:support@terratern.com" className="text-blue-400 hover:text-blue-300">sksaran987@gmail.com</a>
            </div>
            <div>
              <span className="font-medium text-white block">Availability</span>
              <span>Mon - Fri, 9:00 AM - 5:00 PM EST</span>
            </div>
          </div>

          {/* Support Form */}
          <form onSubmit={handleSupportSubmit} className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <input
                type="text"
                value={supportState.subject}
                onChange={(e) => setSupportState({ ...supportState, subject: e.target.value })}
                placeholder="What do you need help with?"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea
                value={supportState.message}
                onChange={(e) => setSupportState({ ...supportState, message: e.target.value })}
                placeholder="Describe your issue or feedback in detail..."
                rows="4"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmittingSupport}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
            >
              <Send size={16} />
              {isSubmittingSupport ? 'Sending...' : 'Send Message'}
            </motion.button>
          </form>
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
