import React, { useState } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const Navbar = ({ user, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    {
      id: 1,
      title: "Audio generated",
      message: "Your text-to-speech audio is ready to download",
      time: "2m ago",
      icon: CheckCircle,
    },
    {
      id: 2,
      title: "New Neural Voices",
      message: "400+ Microsoft Edge neural voices active",
      time: "1h ago",
      icon: Sparkles,
    },
    {
      id: 3,
      title: "Break Tag Support",
      message: "Silent audio breaks with [break: 4s] enabled",
      time: "3h ago",
      icon: Sparkles,
    },
  ];

  const displayName =
    user?.profile?.displayName || user?.name || "Shringika";
  const avatarLetter = (displayName || "S").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-slate-50/85 backdrop-blur-md border-b border-slate-200/60">
      {/* Top signature gradient accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0d3b66] via-[#006699] to-[#009688]" />

      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex items-center flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features, voices, or anything..."
              className="w-full bg-white border border-slate-200/90 rounded-full pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[#006699] shadow-sm transition-all"
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
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl z-50">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Notifications
                    </h3>
                    <span className="text-[10px] font-bold text-[#006699] uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      3 new
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((notif) => {
                      const Icon = notif.icon;
                      return (
                        <div
                          key={notif.id}
                          className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start"
                        >
                          <div className="p-1.5 rounded-lg bg-sky-50 text-[#006699] shrink-0 mt-0.5">
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-xs">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0d3b66] via-[#006699] to-[#009688] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {avatarLetter}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">
                {displayName}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
