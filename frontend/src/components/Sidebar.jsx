import React, { useState } from "react";
import { motion } from "../utils/motion";
import {
  Menu,
  X,
  Home,
  Mic2,
  Music,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  GitMerge,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAdmin } from "../utils/auth";

const Sidebar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Single Speaker", icon: Mic2, path: "/tts" },
    { name: "Multi Speaker", icon: Users, path: "/multi-speaker", isNew: true },
    { name: "Voice Library", icon: Music, path: "/voices" },
    { name: "Merge Audio", icon: GitMerge, path: "/merge" },
    { name: "History", icon: History, path: "/history" },
    ...(isAdmin(user)
      ? [{ name: "Admin Access", icon: ShieldCheck, path: "/admin" }]
      : []),
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-dark-800 border border-white/10 text-white hover:bg-dark-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-40 md:z-20 md:translate-x-0 md:relative md:h-full"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12 mt-8 md:mt-0"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
              <img
                src="/terra-tern-logo.png"
                alt="Terra Tern"
                className="w-full h-full object-contain rounded"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Terra Tern</h1>
              <p className="text-xs text-gray-400">Team Shringika</p>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active ? "text-white" : "group-hover:text-blue-400"
                      }
                    />
                    <span className="font-medium flex items-center gap-2 flex-1 min-w-0 truncate">
                      {item.name}
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/25 tracking-widest uppercase scale-90">
                          New
                        </span>
                      )}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 w-1 h-6 bg-white rounded-l-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/10 pt-6"
          >
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg glass-sm hover:bg-white/8 cursor-pointer">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-semibold shadow-inner bg-gradient-to-br from-blue-400 to-purple-600">
                {user?.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                ) : (
                  "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || "user@example.com"}
                </p>
                {isAdmin(user) && (
                  <p className="text-xs text-emerald-300">Admin access</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (onLogout) {
                  onLogout();
                }
                navigate("/login");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Desktop overlay when sidebar is open */}
      {!isOpen && <div className="hidden md:block w-64" />}
    </>
  );
};

export default Sidebar;
