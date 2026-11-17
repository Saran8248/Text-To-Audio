import React, { useEffect, useState } from "react";
import { Search, Volume2, Sparkles, FileText, RefreshCw, Trash2, Copy } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import HeroBanner from "../components/HeroBanner";

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
    if (!window.confirm("Are you sure you want to clear your generation history?")) {
      return;
    }
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
    <div className="space-y-6">
      {/* Signature Ocean-to-Teal Hero Banner */}
      <HeroBanner
        kicker="AI AUDIO STUDIO"
        title="Generation History"
        description="Review, search, and manage your previously generated Edge TTS voiceovers."
        pills={[
          {
            icon: Volume2,
            label: "Total Files",
            value: `${history.length} items`,
          },
          {
            icon: FileText,
            label: "Audio Format",
            value: "MP3 Audio",
          },
          {
            icon: Sparkles,
            label: "Local Cache",
            value: "Active",
          },
        ]}
        sloganTop="ARCHIVE"
        sloganBottom="VOICE HISTORY"
      />

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              History Controls
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Use search and language filters to quickly find generated audio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleRefreshHistory}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs rounded-xl transition-all"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Search by Text or Voice
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search transcripts, voices, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-[#006699] focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Language Filter
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "all",
                "en-US",
                "en-GB",
                "de-DE",
                "ta-IN",
              ].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedFilter === filter
                      ? "bg-gradient-to-r from-blue-600 to-[#006699] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {filter === "all" ? "All" : filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-sm font-medium">
            Loading generation history...
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Volume2 size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-base">No audio history found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or create a new audio in the Single Speaker studio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const date = new Date(item.timestamp);
            const language =
              item.voice?.split("-").slice(0, 2).join("-") || "en-US";
            const voiceName =
              item.voice?.split("-").slice(-1)[0].replace("Neural", "") || "Voice";

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-sky-300 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3.5 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d3b66] to-[#006699] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Volume2 size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 font-semibold text-xs leading-snug line-clamp-2">
                          {item.text}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {voiceName} • {language} • {date.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.text);
                        toast.success("Text copied to clipboard");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                    >
                      <Copy size={13} />
                      <span>Copy</span>
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
