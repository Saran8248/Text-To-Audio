import React, { useState } from "react";
import {
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

const Navbar = ({ user, onLogout, theme, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Audio generated",
      message: "Your text-to-speech is ready",
      time: "2m ago",
    },
    {
      id: 2,
      title: "New voice added",
      message: "Aria and multilingual Edge voices available",
      time: "1h ago",
    },
    {
      id: 3,
      title: "System ready",
      message: "Production-ready Edge TTS connected",
      time: "3h ago",
    },
  ];

  return (
    <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-full">
        <div className="flex items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex items-center flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search features, voices, or anything..."
              className="w-full bg-white border border-slate-200/90 rounded-full pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 shadow-sm transition-all"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm hover:bg-slate-50 transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl z-50">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Notifications
                    </h3>
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                      3 new
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-slate-800 text-xs">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {notif.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                S
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">
                Shringika
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
