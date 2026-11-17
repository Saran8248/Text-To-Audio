import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  Camera,
  Shield,
  HelpCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getCurrentUser,
  updateUserProfile,
} from "../utils/auth";
import HeroBanner from "../components/HeroBanner";

const Settings = ({ user, onUpdateUser, theme, onThemeChange, onLogout }) => {
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState({
    theme: theme || localStorage.getItem("terra_tern_theme") || "light",
    notifications: true,
    emailUpdates: false,
    twoFactor: false,
    defaultVoice: "en-US-JennyNeural",
    defaultSpeed: 1,
  });

  const [profile, setProfile] = useState({
    email: "",
    name: "",
    avatarUrl: "",
  });

  const [passwordState, setPasswordState] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [supportState, setSupportState] = useState({
    subject: "",
    message: "",
  });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Load User Info
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setProfile({
          email: user.email || "",
          name: user.profile?.displayName || user.name || "",
          avatarUrl: user.profile?.avatarUrl || "",
        });
      } else {
        const current = await getCurrentUser();
        if (current) {
          setProfile({
            email: current.email || "",
            name: current.profile?.displayName || current.name || "",
            avatarUrl: current.profile?.avatarUrl || "",
          });
        }
      }
    };
    loadProfile();
  }, [user]);

  // Support Submission Handler
  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportState.subject.trim() || !supportState.message.trim()) {
      toast.error("Please fill in both Subject and Message");
      return;
    }

    setIsSubmittingSupport(true);
    setTimeout(() => {
      setIsSubmittingSupport(false);
      toast.success(
        "Support request submitted! Our team will get back to you shortly."
      );
      setSupportState({ subject: "", message: "" });
    }, 1000);
  };

  // Avatar Upload Handlers
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfile((prev) => ({
        ...prev,
        avatarUrl: event.target.result,
      }));
      toast.info("Avatar selected. Click 'Save Profile' to persist.");
    };
    reader.readAsDataURL(file);
  };

  // Profile Save Handler
  const handleProfileSave = async () => {
    if (!profile.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    const result = await updateUserProfile({
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });

    if (result.success) {
      toast.success("Profile updated successfully");
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || "Unable to save profile");
    }
  };

  // Password Update Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordState.newPassword) {
      toast.error("Password cannot be empty");
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const result = await updateUserProfile({
      name: profile.name,
      email: profile.email,
      password: passwordState.newPassword,
    });

    if (result.success) {
      toast.success("Password updated successfully");
      setPasswordState({ newPassword: "", confirmPassword: "" });
      if (onUpdateUser) {
        onUpdateUser(result.user);
      }
    } else {
      toast.error(result.message || "Unable to update password");
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Setting updated");
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    toast.success("Setting updated");
  };

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const SettingToggle = ({
    icon: Icon,
    label,
    description,
    value,
    onChange,
  }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#006699]">
          <Icon size={18} />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-xs">{label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? "bg-gradient-to-r from-blue-600 to-[#009688]" : "bg-slate-300"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? "transform translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Signature Ocean-to-Teal Hero Banner */}
      <HeroBanner
        kicker="AI AUDIO STUDIO"
        title="Studio Settings"
        description="Manage your studio profile, speech preferences, security configurations, and contact support."
        pills={[
          {
            icon: User,
            label: "Profile",
            value: profile.name || "Saran Admin",
          },
          {
            icon: Shield,
            label: "Role",
            value: "Studio Admin",
          },
          {
            icon: Sparkles,
            label: "TTS Engine",
            value: "Edge TTS v2",
          },
        ]}
        sloganTop="SETTINGS"
        sloganBottom="PREFERENCES"
      />

      {/* Profile Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <User className="text-[#006699]" size={18} />
          Profile Settings
        </h3>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-2">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              onClick={handleAvatarClick}
              className="relative w-24 h-24 rounded-full border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-teal-50 overflow-hidden group cursor-pointer hover:border-[#006699] transition-all flex items-center justify-center shadow-sm"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-extrabold text-[#006699]">
                  {getInitials(profile.name)}
                </span>
              )}
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                <Camera size={18} />
                <span className="text-[10px] font-semibold">Change</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-[11px] text-slate-400">Max size: 2MB (JPG/PNG)</p>
          </div>

          {/* Profile Form Details */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
            <button
              onClick={handleProfileSave}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl font-semibold text-white text-xs shadow-md shadow-sky-500/20 transition-all"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>

      {/* Security & Password Changing */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Shield className="text-[#006699]" size={18} />
          Security & Password
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordState.newPassword}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto flex h-7 w-7 items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordState.confirmPassword}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 my-auto flex h-7 w-7 items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl font-semibold text-white text-xs shadow-md shadow-sky-500/20 transition-all"
          >
            Update Password
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <SettingToggle
            icon={Lock}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            value={settings.twoFactor}
            onChange={() => handleToggle("twoFactor")}
          />
        </div>
      </div>

      {/* Studio Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 mb-2">
          Synthesis Preferences
        </h3>

        {/* Default Voice */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Default Synthesis Voice
          </label>
          <select
            value={settings.defaultVoice}
            onChange={(e) => handleChange("defaultVoice", e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
          >
            <option value="en-US-AriaNeural">Aria (English US Female)</option>
            <option value="en-US-GuyNeural">Guy (English US Male)</option>
            <option value="en-GB-LibbyNeural">Libby (English UK Female)</option>
            <option value="de-DE-KatjaNeural">Katja (German Female)</option>
            <option value="ta-IN-PallaviNeural">Pallavi (Tamil India Female)</option>
            <option value="fr-FR-DeniseNeural">Denise (French Female)</option>
            <option value="ar-AE-FatimaNeural">Fatima (Arabic UAE Female)</option>
          </select>
        </div>

        {/* Default Speed */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Default Speech Rate
            </label>
            <span className="text-xs font-bold text-[#006699]">
              {settings.defaultSpeed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.defaultSpeed}
            onChange={(e) =>
              handleChange("defaultSpeed", parseFloat(e.target.value))
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#006699]"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 mb-2">
          Notifications
        </h3>
        <SettingToggle
          icon={Bell}
          label="Push Notifications"
          description="Receive notifications about audio generation and API updates"
          value={settings.notifications}
          onChange={() => handleToggle("notifications")}
        />
        <SettingToggle
          icon={Mail}
          label="Email Updates"
          description="Get email notifications about new voice releases and studio updates"
          value={settings.emailUpdates}
          onChange={() => handleToggle("emailUpdates")}
        />
      </div>

      {/* Customer Support */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <HelpCircle className="text-[#009688]" size={18} />
          Customer Support
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4 text-xs text-slate-600">
            <p>
              Have questions or need technical support with speech synthesis or break tags? Contact our support engineering team.
            </p>
            <div className="pt-1">
              <span className="font-semibold text-slate-900 block">
                Direct Email Support
              </span>
              <a
                href="mailto:sksaran987@gmail.com"
                className="text-[#006699] font-medium hover:underline"
              >
                sksaran987@gmail.com
              </a>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block">
                Response Window
              </span>
              <span className="text-slate-500">24/7 Priority Support</span>
            </div>
          </div>

          <form
            onSubmit={handleSupportSubmit}
            className="md:col-span-2 space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={supportState.subject}
                onChange={(e) =>
                  setSupportState({ ...supportState, subject: e.target.value })
                }
                placeholder="What do you need assistance with?"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Message
              </label>
              <textarea
                value={supportState.message}
                onChange={(e) =>
                  setSupportState({ ...supportState, message: e.target.value })
                }
                placeholder="Describe your issue or feedback in detail..."
                rows="3"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingSupport}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl font-semibold text-white text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
            >
              <Send size={14} />
              <span>{isSubmittingSupport ? "Sending..." : "Send Message"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
