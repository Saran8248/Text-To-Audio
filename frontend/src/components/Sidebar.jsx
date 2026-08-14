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
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-void-800 border border-ember-500/20 text-ember-100 hover:bg-void-700 shadow-glow-sm"
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
        className="fixed left-0 top-0 h-screen w-64 glass-dark border-r border-ember-500/20 z-40 md:z-20 md:translate-x-0 md:relative md:h-full"
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12 mt-8 md:mt-0"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ember-500/10 ring-1 ring-ember-500/30 flex items-center justify-center shadow-glow-sm">
              <img
                src="/terra-tern-logo.png"
                alt="Terra Tern"
                className="w-full h-full object-contain rounded"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ember-50 tracking-wide uppercase">Terra Tern</h1>
              <p className="text-xs text-ember-400">Team Shringika</p>
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
                        ? "bg-liquid-fire text-white shadow-glow-ember"
                        : "text-void-400 hover:text-ember-50 hover:bg-void-800/50 hover:shadow-glow-sm"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "group-hover:text-ember-400 transition-colors"
                      }
                    />
                    <span className="font-medium flex items-center gap-2 flex-1 min-w-0 truncate">
                      {item.name}
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-ember-500/20 text-ember-400 border border-ember-500/25 tracking-widest uppercase scale-90 shadow-glow-sm">
                          New
                        </span>
                      )}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 w-1 h-6 bg-ember-100 rounded-l-full shadow-[0_0_10px_#ffa62e]"
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
