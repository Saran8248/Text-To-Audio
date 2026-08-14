import React, { useState } from "react";
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
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-40 md:z-20 transition-transform duration-300 md:translate-x-0 md:relative md:h-full ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 mt-8 md:mt-0">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-sky-50 flex items-center justify-center border border-brand-100">
              <img
                src="/terra-tern-logo.png"
                alt="Terra Tern"
                className="w-full h-full object-contain rounded"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-wide uppercase">Terra Tern</h1>
              <p className="text-xs text-slate-500">Team Shringika</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <div key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={active ? "text-white" : "group-hover:text-sky-500 transition-colors"}
                    />
                    <span className="font-medium flex items-center gap-2 flex-1 min-w-0 truncate">
                      {item.name}
                      {item.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-brand-100 text-sky-600 border border-sky-200 tracking-widest uppercase scale-90">
                          New
                        </span>
                      )}
                    </span>
                    {active && (
                      <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

        </div>
      </div>

      {/* Desktop overlay when sidebar is open */}
      {!isOpen && <div className="hidden md:block w-64" />}
    </>
  );
};

export default Sidebar;
