import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { motion } from "../utils/motion";
import { ArrowUpRight, Zap, Volume2, TrendingUp } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const formatLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildWeeklyUsage = (history) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      dateKey: formatLocalDateKey(date),
      usage: 0,
    };
  });

  const usageByDay = days.reduce((acc, item) => {
    acc[item.dateKey] = item;
    return acc;
  }, {});

  history.forEach((item) => {
    const date = new Date(item.timestamp);
    if (Number.isNaN(date.getTime())) return;

    const dateKey = formatLocalDateKey(date);
    if (usageByDay[dateKey]) {
      usageByDay[dateKey].usage += 1;
    }
  });

  return days;
};

const StatCard = ({ icon: Icon, label, value, change, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
  >
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-3 mb-4`}
    >
      <Icon size={24} className="text-white" />
    </div>
    <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
    <p className="text-3xl font-bold text-white mb-2">{value}</p>
    {typeof change === "number" && (
      <div className="flex items-center gap-1 text-green-400 text-sm">
        <ArrowUpRight size={16} />
        <span>{change}% vs last month</span>
      </div>
    )}
  </motion.div>
);

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  gradient: PropTypes.string.isRequired,
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGenerated: 0,
    thisMonth: 0,
    averageTime: 0,
    cacheFiles: 0,
    successCount: 0,
    failureCount: 0,
    genderCounts: { male: 0, female: 0, other: 0 },
    languageCounts: {},
  });
  const [historyCount, setHistoryCount] = useState(0);
  const [recentAudios, setRecentAudios] = useState([]);
  const [chartData, setChartData] = useState([]);

  const maxUsage = Math.max(...chartData.map((item) => item.usage), 0);
  const hasWeeklyUsage = chartData.some((item) => item.usage > 0);
  const totalAttempts = stats.successCount + stats.failureCount;
  const successRate = totalAttempts
    ? Math.round((stats.successCount / totalAttempts) * 100)
    : 0;
  const failureRate = totalAttempts
    ? Math.round((stats.failureCount / totalAttempts) * 100)
    : 0;
  const genderTotal =
    stats.genderCounts.male +
    stats.genderCounts.female +
    stats.genderCounts.other;
  const languageEntries = Object.entries(stats.languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
        const statsData = statsResponse.data || {};

        setStats({
          totalGenerated: statsData.historyEntries || history.length,
          thisMonth: history.filter((item) => {
            const date = new Date(item.timestamp);
            return (
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            );
          }).length,
          averageTime: statsData.averageTime || 0,
          cacheFiles: statsData.cacheFiles || 0,
          successCount: statsData.successCount || 0,
          failureCount: statsData.failureCount || 0,
          genderCounts: statsData.genderCounts || {
            male: 0,
            female: 0,
            other: 0,
          },
          languageCounts: statsData.languageCounts || {},
        });
        setHistoryCount(history.length);
        setRecentAudios(history.slice(0, 5));
        setChartData(buildWeeklyUsage(history));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setRecentAudios([]);
        setChartData(buildWeeklyUsage([]));
      }
    };

    loadDashboardData();
  }, []);

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
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="text-gray-400 mb-6">
            You've generated {stats.thisMonth} audio files this month. Keep
            creating amazing content!
          </p>
          <div className="flex gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/tts")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30"
            >
              Create New Audio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/merge")}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              Merge Audio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/transcribe")}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-teal-500/30"
            >
              Audio to Text
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/voices")}
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
          value={stats.averageTime ? `${stats.averageTime}s` : "N/A"}
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
          <div className="relative h-[320px] border-l border-b border-white/10 px-4 pb-8 pt-6">
            <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 h-px bg-white/10"
                  style={{ top: `${index * 25}%` }}
                />
              ))}
            </div>
            <div className="relative h-full flex items-end gap-3">
              {chartData.map((item) => {
                const height =
                  maxUsage > 0 ? Math.max((item.usage / maxUsage) * 100, 8) : 0;
                return (
                  <div
                    key={item.day}
                    className="flex-1 h-full flex flex-col justify-end items-center gap-2"
                  >
                    <div className="text-xs text-gray-400">{item.usage}</div>
                    <div
                      className={`w-full max-w-12 rounded-t-full transition-all ${
                        item.usage > 0
                          ? "bg-gradient-to-t from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20"
                          : "bg-white/10"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">{item.day}</span>
                  </div>
                );
              })}
            </div>
            {!hasWeeklyUsage && (
              <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center text-center text-sm text-gray-400 pointer-events-none">
                No audio generated in the last 7 days.
              </div>
            )}
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
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Operational
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">
            Generation Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Success</span>
              <span className="text-white font-semibold">
                {stats.successCount}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Failure</span>
              <span className="text-white font-semibold">
                {stats.failureCount}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${failureRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Success rate</span>
              <span>{successRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Failure rate</span>
              <span>{failureRate}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">
            Gender Breakdown
          </h3>
          <div className="space-y-4">
            {["male", "female", "other"].map((key) => {
              const count = stats.genderCounts[key] || 0;
              const width = genderTotal
                ? Math.round((count / genderTotal) * 100)
                : 0;
              let barColor = "bg-violet-500";
              if (key === "male") barColor = "bg-blue-500";
              else if (key === "female") barColor = "bg-pink-500";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-6">Top Languages</h3>
          <div className="space-y-4">
            {languageEntries.length > 0 ? (
              languageEntries.map(([language, count]) => (
                <div key={language} className="space-y-2">
                  <div className="flex items-center justify-between text-gray-400 text-sm">
                    <span>{language}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${Math.min(100, Math.round((count / Math.max(historyCount, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No language data available.
              </p>
            )}
            {languageEntries.length > 0 && historyCount > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                Showing top {languageEntries.length} of{" "}
                {Object.keys(stats.languageCounts).length} detected languages.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Audios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-xl font-bold text-white mb-6">
          Recent Generated Audios
        </h3>
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

Dashboard.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
  }),
};

export default Dashboard;
