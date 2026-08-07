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
  GitMerge,
  Users,
  FileText,
  Files,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";


const Sidebar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Single Speaker", icon: Mic2, path: "/tts" },
    { name: "Multi Speaker", icon: Users, path: "/multi-speaker", isNew: true },
    { name: "Voice Library", icon: Music, path: "/voices" },
    { name: "Merge Audio", icon: GitMerge, path: "/merge" },
    { name: "Merge Word", icon: Files, path: "/merge-word" },
    { name: "Audio to Text", icon: FileText, path: "/transcribe", isNew: true },
    { name: "History", icon: History, path: "/history" },
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


        </div>
      </motion.div>

      {/* Desktop overlay when sidebar is open */}
      {!isOpen && <div className="hidden md:block w-64" />}
    </>
  );
};

export default Sidebar;
