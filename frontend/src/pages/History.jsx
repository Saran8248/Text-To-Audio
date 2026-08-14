import React, { useEffect, useState } from "react";
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
      <div className="mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Generation History
        </h1>
        <p className="text-slate-600">
          View and manage your previously generated audio files
        </p>
      </div>

      {/* Search & Filter */}
      <div className="glass p-6 rounded-2xl border border-slate-200"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              History Controls
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Use search and filters to find generated audio items quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleRefreshHistory}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400"
            >
              Refresh
            </button>
            <button onClick={handleClearHistory}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400"
            >
              Clear History
            </button>
          </div>
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-3">
              Search
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search by text or voice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-3">
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
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)} className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === filter
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {filter === "all" ? "All Languages" : filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="glass p-6 rounded-2xl border border-slate-200 text-center"
        >
          <p className="text-slate-900 font-medium">
            Loading generation history...
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12"
        >
          <Volume2 size={48} className="text-slate-500 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No audio history found</p>
          <p className="text-sm text-slate-500 mt-2">
            Try refreshing or changing the filter to show more results.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, idx) => {
            const date = new Date(item.timestamp);
            const language =
              item.voice?.split("-").slice(0, 2).join("-") || "Unknown";
            return (
              <div
                key={item.id} className="glass p-6 rounded-2xl border border-slate-200 hover:border-slate-200 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Volume2 size={20} className="text-slate-900" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-medium truncate">
                          {item.text}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {item.voice} • {language} • {date.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
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
                    <button onClick={() =>
                        toast.info("Playback is not available in this preview")
                      }
                      className="px-4 py-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Play
                    </button>
                    <button onClick={() =>
                        toast.success("Saved entry copied to clipboard") &&
                        navigator.clipboard.writeText(item.text)
                      }
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
                    >
                      Copy Text
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
