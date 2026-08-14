import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
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
  <div
    className="relative group p-[1px] rounded-2xl overflow-hidden shadow-soft"
  >
    <div className="relative h-full glass p-6 rounded-2xl border border-slate-200">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} p-3 mb-4 shadow-sm`}
      >
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-slate-500 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
      {typeof change === "number" && (
        <div className="flex items-center gap-1 text-sky-600 text-sm font-semibold">
          <ArrowUpRight size={16} />
          <span>{change}% vs last month</span>
        </div>
      )}
    </div>
  </div>
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
      <div
        className="glass p-8 rounded-3xl border border-slate-200 overflow-hidden relative shadow-soft"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-100 to-brand-50 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome to Terra Tern
          </h1>
          <p className="text-slate-600 mb-6">
            You've generated {stats.thisMonth} audio files this month. Keep
            creating amazing content!
          </p>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate("/tts")}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-lg font-bold text-white shadow-sm transition-colors"
            >
              Create New Audio
            </button>
            <button
              onClick={() => navigate("/merge")}
              className="px-6 py-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Merge Audio
            </button>
            <button
              onClick={() => navigate("/transcribe")}
              className="px-6 py-3 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Audio to Text
            </button>
            <button
              onClick={() => navigate("/voices")}
              className="px-6 py-3 bg-slate-50 border border-slate-200 shadow-sm border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Voice Library
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Volume2}
          label="Total Generated"
          value={stats.totalGenerated}
          change={12}
          gradient="from-brand-500 to-brand-600"
        />
        <StatCard
          icon={Zap}
          label="This Month"
          value={stats.thisMonth}
          change={8}
          gradient="from-brand-400 to-brand-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Time"
          value={stats.averageTime ? `${stats.averageTime}s` : "N/A"}
          change={-3}
          gradient="from-slate-500 to-slate-600"
        />
        <StatCard
          icon={Volume2}
          label="Cached Files"
          value={stats.cacheFiles}
          change={25}
          gradient="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div
          className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">Weekly Usage</h3>
          <div className="relative h-[320px] border-l border-b border-slate-200 px-4 pb-8 pt-6">
            <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="absolute left-0 right-0 h-px bg-slate-100"
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
                    <div className="text-xs text-slate-400">{item.usage}</div>
                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-all ${
                        item.usage > 0
                          ? "bg-sky-500"
                          : "bg-slate-100"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
            {!hasWeeklyUsage && (
              <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center text-center text-sm text-slate-400 pointer-events-none">
                No audio generated in the last 7 days.
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className="glass p-6 rounded-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">AI Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">System Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">API Latency</span>
              <span className="text-slate-900 font-medium">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Voices</span>
              <span className="text-slate-900 font-medium">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Uptime</span>
              <span className="text-slate-900 font-medium">99.9%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="glass p-6 rounded-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Generation Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Success</span>
              <span className="text-slate-900 font-semibold">
                {stats.successCount}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Failure</span>
              <span className="text-slate-900 font-semibold">
                {stats.failureCount}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${failureRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Success rate</span>
              <span>{successRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Failure rate</span>
              <span>{failureRate}%</span>
            </div>
          </div>
        </div>

        <div
          className="glass p-6 rounded-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            Gender Breakdown
          </h3>
          <div className="space-y-4">
            {["male", "female", "other"].map((key) => {
              const count = stats.genderCounts[key] || 0;
              const width = genderTotal
                ? Math.round((count / genderTotal) * 100)
                : 0;
              let barColor = "bg-violet-500";
              if (key === "male") barColor = "bg-sky-500";
              else if (key === "female") barColor = "bg-pink-500";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-slate-600 text-sm mb-2">
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="glass p-6 rounded-2xl border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">Top Languages</h3>
          <div className="space-y-4">
            {languageEntries.length > 0 ? (
              languageEntries.map(([language, count]) => (
                <div key={language} className="space-y-2">
                  <div className="flex items-center justify-between text-slate-600 text-sm">
                    <span>{language}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-400"
                      style={{
                        width: `${Math.min(100, Math.round((count / Math.max(historyCount, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No language data available.
              </p>
            )}
            {languageEntries.length > 0 && historyCount > 0 && (
              <p className="text-xs text-slate-400 mt-3">
                Showing top {languageEntries.length} of{" "}
                {Object.keys(stats.languageCounts).length} detected languages.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Audios */}
      <div
        className="glass p-6 rounded-2xl border border-slate-200"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-6">
          Recent Generated Audios
        </h3>
        <div className="space-y-3">
          {recentAudios.map((audio) => (
            <div
              key={audio.id}
              className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 shadow-sm rounded-xl border border-slate-200 hover:border-sky-200 hover:bg-sky-50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-slate-800 font-medium truncate">{audio.text}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {audio.voice} • {new Date(audio.timestamp).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-slate-400 ml-4">Generated</p>
            </div>
          ))}
          {recentAudios.length === 0 && (
            <p className="text-sm text-slate-500">No generated audio yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
  }),
};

export default Dashboard;
