import React, { useState } from "react";
import {
  Bell,
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
      message: "British English voice available",
      time: "1h ago",
    },
    {
      id: 3,
      title: "Usage updated",
      message: "Check your monthly stats",
      time: "3h ago",
    },
  ];

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4 flex-1"></div>

          {/* Right side */}
          <div className="flex items-center gap-4">


            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Bell size={20} />
                <div
                  className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-500 rounded-full border-2 border-white"
                />
              </button>

              
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-elevated"
                  >
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <p className="font-medium text-slate-800 text-sm">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {notif.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
