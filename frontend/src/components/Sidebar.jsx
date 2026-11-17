import React, { useState } from "react";
import {
  Menu,
  X,
  Home,
  Mic2,
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
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0b1528] text-slate-300 border-r border-slate-800/80 z-40 md:z-20 transition-transform duration-300 md:translate-x-0 md:relative md:h-full flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 mt-6 md:mt-1 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                <path
                  d="M19.5 4.5C17 7.2 13 9.5 9 9.5C5.8 9.5 3.5 8.2 2 6.5C3.2 10.2 6.2 12 9.2 12.8C6.8 13.8 4 13.5 2.5 12C3.8 15.2 6.8 16.8 10.2 16.5C13.8 16.2 17.5 13.8 19.5 10.5C20.8 12.8 22 16.5 22 19.5C23 15 22.8 9.8 19.5 4.5Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wider uppercase">
                Terra Tern
              </h1>
              <p className="text-[11px] font-medium text-cyan-400">Team Shringika</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <div key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                    className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium ${
                      active
                        ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-white" : "group-hover:text-cyan-400 transition-colors"}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.isNew && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-400/30 tracking-wider uppercase">
                        NEW
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Mountain Silhouette & Brand Slogan Footer */}
          <div className="relative mt-auto pt-4 overflow-hidden border-t border-slate-800/40">
            <svg viewBox="0 0 200 50" fill="none" className="w-full h-10 opacity-30">
              <path d="M0 50L30 28L60 38L100 15L145 34L175 22L200 50Z" fill="#1e3a5f" />
              <path d="M25 50L65 30L110 42L150 18L200 45V50H25Z" fill="#0f2642" />
            </svg>
            <div className="text-center pb-2">
              <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
                HIGHER IDEAS
              </p>
              <p className="text-[9px] font-semibold tracking-[0.25em] text-slate-500 uppercase mt-0.5">
                CLEARER VOICES
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop overlay when sidebar is open */}
      {!isOpen && <div className="hidden md:block w-64" />}
    </>
  );
};

export default Sidebar;

