import React, { useEffect, useState } from "react";
import { motion } from "../utils/motion";
import { Search, Volume2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tts/history`);
      setHistory(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to load generation history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRefreshHistory = () => {
    loadHistory();
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tts/history`);
      setHistory([]);
      toast.success("Generation history cleared");
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  const filteredHistory = history.filter((item) => {
    const language = item.voice?.split("-").slice(0, 2).join("-") || "";
    const matchesSearch = `${item.text} ${item.voice}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (selectedFilter !== "all" && language !== selectedFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          Generation History
        </h1>
        <p className="text-gray-400">
          View and manage your previously generated audio files
        </p>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              History Controls
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Use search and filters to find generated audio items quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefreshHistory}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400"
            >
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400"
            >
              Clear History
            </motion.button>
          </div>
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Search
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search by text or voice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Language filter
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "all",
                "en-US",
                "en-GB",
                "en-AU",
                "de-DE",
                "fr-FR",
                "ja-JP",
                "uk-UA",
              ].map((filter) => (
                <motion.button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === filter
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {filter === "all" ? "All Languages" : filter}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* History List */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10 text-center"
        >
          <p className="text-white font-medium">
            Loading generation history...
          </p>
        </motion.div>
      ) : filteredHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Volume2 size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No audio history found</p>
          <p className="text-sm text-gray-500 mt-2">
            Try refreshing or changing the filter to show more results.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, idx) => {
            const date = new Date(item.timestamp);
            const language =
              item.voice?.split("-").slice(0, 2).join("-") || "Unknown";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Volume2 size={20} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">
                          {item.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.voice} • {language} • {date.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>Saved in local generation history</span>
                      <span>
                        {item.duration
                          ? `Duration: ${item.duration}s`
                          : "Duration unavailable"}
                      </span>
                      <span>
                        {item.size ? `${item.size} KB` : "Size unavailable"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        toast.info("Playback is not available in this preview")
                      }
                      className="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 hover:bg-white/10"
                    >
                      Play
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        toast.success("Saved entry copied to clipboard") &&
                        navigator.clipboard.writeText(item.text)
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
                    >
                      Copy Text
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
