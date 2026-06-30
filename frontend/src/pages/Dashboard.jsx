import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '../utils/motion';
import { ArrowUpRight, Zap, Volume2, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGenerated: 0,
    thisMonth: 0,
    averageTime: 0,
    cacheFiles: 0,
  });
  const [recentAudios, setRecentAudios] = useState([]);

  const chartData = [
    { day: 'Mon', usage: 120 },
    { day: 'Tue', usage: 240 },
    { day: 'Wed', usage: 180 },
    { day: 'Thu', usage: 290 },
    { day: 'Fri', usage: 340 },
    { day: 'Sat', usage: 220 },
    { day: 'Sun', usage: 150 },
  ];
  const maxUsage = Math.max(...chartData.map((item) => item.usage));

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsResponse, historyResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/stats`),
          axios.get(`${API_BASE_URL}/api/tts/history`),
        ]);
        const history = historyResponse.data?.data || [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        setStats({
          totalGenerated: statsResponse.data?.historyEntries || history.length,
          thisMonth: history.filter((item) => {
            const date = new Date(item.timestamp);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          }).length,
          averageTime: 0,
          cacheFiles: statsResponse.data?.cacheFiles || 0,
        });
        setRecentAudios(history.slice(0, 5));
      } catch (error) {
        setRecentAudios([]);
      }
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, change, gradient }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-3 mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className="flex items-center gap-1 text-green-400 text-sm">
        <ArrowUpRight size={16} />
        <span>{change}% vs last month</span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl border border-white/10 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-0" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name || 'User'}</h1>
          <p className="text-gray-400 mb-6">You've generated {stats.thisMonth} audio files this month. Keep creating amazing content!</p>
          <div className="flex gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/tts')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30"
            >
              Create New Audio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/voices')}
              className="px-6 py-3 glass border border-white/20 rounded-lg font-medium text-white hover:bg-white/10"
            >
              Voice Library
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Volume2}
          label="Total Generated"
          value={stats.totalGenerated}
          change={12}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Zap}
          label="This Month"
          value={stats.thisMonth}
          change={8}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Time"
          value={stats.averageTime ? `${stats.averageTime}s` : 'N/A'}
          change={-3}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={Volume2}
          label="Cached Files"
          value={stats.cacheFiles}
          change={25}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">Weekly Usage</h3>
          <div className="h-[300px] flex items-end gap-3 border-l border-b border-white/10 px-4 pb-8 pt-4">
            {chartData.map((item) => {
              const height = Math.max((item.usage / maxUsage) * 100, 8);
              return (
                <div key={item.day} className="flex-1 h-full flex flex-col justify-end items-center gap-3">
                  <div className="relative w-full flex justify-center group">
                    <div
                      className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 transition-all group-hover:from-purple-500 group-hover:to-blue-400"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-9 px-2 py-1 rounded bg-dark-800 border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.usage}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{item.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">AI Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">System Status</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Latency</span>
              <span className="text-green-400 font-medium">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Voices</span>
              <span className="text-blue-400 font-medium">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="text-green-400 font-medium">99.9%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Audios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-bold text-white mb-6">Recent Generated Audios</h3>
        <div className="space-y-3">
          {recentAudios.map((audio, idx) => (
            <motion.div
              key={audio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-4 glass-sm rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
            >
              <div className="flex-1">
                <p className="text-white font-medium truncate">{audio.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {audio.voice} • {new Date(audio.timestamp).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-500 ml-4">Generated</p>
            </motion.div>
          ))}
          {recentAudios.length === 0 && (
            <p className="text-sm text-gray-400">No generated audio yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
