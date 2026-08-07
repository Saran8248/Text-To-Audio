import React, { useState } from "react";
import { motion, AnimatePresence } from "../utils/motion";
import {
  Bell,
  Sun,
  Moon,
} from "lucide-react";


const Navbar = ({ user, onLogout, theme, onToggleTheme }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const isDark = theme === "dark";




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
    <div className="sticky top-0 z-30 glass border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4 flex-1"></div>

          {/* Right side */}
          <div className="flex items-center gap-4">

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleTheme}
              className="p-2 rounded-lg glass-sm hover:bg-white/10 text-gray-400 hover:text-white"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg glass-sm hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Bell size={20} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                />
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-white/10 overflow-hidden shadow-xl"
                  >
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold text-white">
                        Notifications
                      </h3>
                    </div>
                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <p className="font-medium text-white text-sm">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            {notif.time}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
