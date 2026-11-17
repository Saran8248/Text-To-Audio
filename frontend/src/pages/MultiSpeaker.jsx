import React, { useState, useEffect, useRef } from "react";
import { Users, Cpu, CheckCircle, Download } from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/apiHelper";
import { fallbackVoices } from "../config/voices";

const localeNames = {
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  ta: "Tamil",
  ar: "Arabic",
};

const MultiSpeaker = () => {
  const [conversationText, setConversationText] = useState(
    "Tom: Hello Anna.\nAnna: Hello Tom.\nNarrator: Both go to the restaurant.\nTom: I would like some Pizza.\nAnna: I'll have Pasta.",
  );
  const [voices, setVoices] = useState([]);
  const [voiceMapping, setVoiceMapping] = useState({});
  const [speakerLanguages, setSpeakerLanguages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [speakerOrder, setSpeakerOrder] = useState([]);

  const audioRef = useRef(null);

  useEffect(() => {
    // Process voices locally
    try {
      const groupedVoices = fallbackVoices || {};
      const flatVoices = [];

      Object.entries(groupedVoices).forEach(([locale, list]) => {
        if (Array.isArray(list)) {
          list.forEach((v) => {
            flatVoices.push({
              shortName: v.id,
              displayName: v.name,
              gender: v.type,
              locale: locale,
            });
          });
        }
      });

      setVoices(flatVoices);
    } catch (err) {
      console.error("Failed to load voices:", err);
      toast.error("Unable to load voice library list.");
    }

    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  // Real-time Speaker Detection
  useEffect(() => {
    if (!conversationText.trim()) {
      setVoiceMapping({});
      setSpeakerLanguages({});
      return;
    }

    const lines = conversationText.split("\n");
    const uniqueSpeakers = new Set();

    lines.forEach((line) => {
      // eslint-disable-next-line no-useless-escape
      const match = line.trim().match(/^([*#_~\[]*[\p{L}\p{N}\s_-]+?[*#_~\]]*)\s*[:\-–—]/u);
      if (match) {
        // eslint-disable-next-line no-useless-escape
        const potentialSpeaker = match[1].replace(/^[*#_~\[\s]+|[*#_~\]\s]+$/g, "").trim();
        if (potentialSpeaker && !/^\d+$/.test(potentialSpeaker) && !["break", "pause", "silence"].includes(potentialSpeaker.toLowerCase())) {
          uniqueSpeakers.add(potentialSpeaker);
        }
      }
    });

    const speakerList = Array.from(uniqueSpeakers);

    setVoiceMapping((prevMapping) => {
      const newMapping = {};
      const newLanguages = {};

      speakerList.forEach((speaker) => {
        if (prevMapping[speaker]) {
          newMapping[speaker] = prevMapping[speaker];
        } else {
          const lower = speaker.toLowerCase();
          if (
            lower.includes("anna") ||
            lower.includes("female") ||
            lower.includes("girl")
          ) {
            newMapping[speaker] = "en-US-AriaNeural";
          } else if (
            lower.includes("tom") ||
            lower.includes("male") ||
            lower.includes("boy")
          ) {
            newMapping[speaker] = "en-US-GuyNeural";
          } else if (
            lower.includes("narrator") ||
            lower.includes("story") ||
            lower.includes("erzähler")
          ) {
            newMapping[speaker] = "en-GB-LibbyNeural";
          } else {
            newMapping[speaker] = "en-GB-RyanNeural";
          }
        }

        const voiceId = newMapping[speaker];
        const voiceObj = voices.find((v) => v.shortName === voiceId);
        const fullLocale = voiceObj ? voiceObj.locale : (voiceId.split("-").slice(0, 2).join("-") || "en");
        newLanguages[speaker] = fullLocale.split("-")[0];
      });

      setSpeakerLanguages(newLanguages);
      
      // Update speaker order while preserving existing order
      setSpeakerOrder((prevOrder) => {
        const newOrder = prevOrder.filter(s => newMapping[s]); // keep existing in order
        speakerList.forEach(s => {
          if (!newOrder.includes(s)) newOrder.push(s);
        });
        return newOrder;
      });

      return newMapping;
    });
  }, [conversationText, voices]);

  // Sync languages state when voices list updates
  useEffect(() => {
    if (voices.length === 0 || Object.keys(voiceMapping).length === 0) return;
    setSpeakerLanguages((prev) => {
      const updated = { ...prev };
      Object.entries(voiceMapping).forEach(([speaker, voiceId]) => {
        if (!updated[speaker]) {
          const found = voices.find((v) => v.shortName === voiceId);
          if (found) {
            updated[speaker] = found.locale.split("-")[0];
          }
        }
      });
      return updated;
    });
  }, [voices, voiceMapping]);

  const handleLanguageChange = (speaker, newLocale) => {
    setSpeakerLanguages((prev) => ({
      ...prev,
      [speaker]: newLocale,
    }));

    const localeVoices = voices.filter((v) => v.locale.startsWith(newLocale));
    if (localeVoices.length > 0) {
      setVoiceMapping((prev) => ({
        ...prev,
        [speaker]: localeVoices[0].shortName,
      }));
    }
  };

  const handleVoiceChange = (speaker, voiceId) => {
    setVoiceMapping((prev) => ({
      ...prev,
      [speaker]: voiceId,
    }));
  };

  const handleGenerateAudio = async () => {
    if (Object.keys(voiceMapping).length === 0) {
      toast.warn(
        'No speakers detected in the conversation. Format must contain "Speaker: Text".',
      );
      return;
    }

    setIsGenerating(true);
    const generateToast = toast.loading(
      "Generating conversation audio tracks...",
      { autoClose: false },
    );

    try {
      const token = localStorage.getItem("terra_tern_auth_token");
      const response = await apiFetch(`/api/tts/multi-speaker`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: conversationText,
          voiceMapping: voiceMapping,
        }),
      });

      const audioBlob = await response.blob();
      const mp3Blob = new Blob([audioBlob], { type: "audio/mpeg" });
      const url = URL.createObjectURL(mp3Blob);

      setMergedUrl(url);
      if (audioRef.current) {
        audioRef.current.load();
      }
      toast.dismiss(generateToast);
      toast.success("Conversation audio successfully generated!");
    } catch (err) {
      console.error("MultiSpeaker API Error:", err);
      toast.dismiss(generateToast);
      
      let errorMessage = err.message || "Generation failed.";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || errorMessage.includes("Load failed")) {
        errorMessage = "Network connection failed. Could not reach audio server.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner matching the design */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d3b66] via-[#006699] to-[#009688] p-7 sm:p-9 text-white shadow-xl">
        {/* Abstract Fluid Curved Wave lines in background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
        >
          <path
            d="M0,150 C300,50 600,280 1000,100"
            stroke="url(#ms-wave-grad)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M0,180 C250,90 550,250 1000,130"
            stroke="url(#ms-wave-grad)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,210 C350,120 650,220 1000,160"
            stroke="url(#ms-wave-grad)"
            strokeWidth="1.5"
            fill="none"
          />
          <defs>
            <linearGradient id="ms-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Flying Dove Silhouette Illustration */}
        <div className="absolute right-12 top-6 pointer-events-none opacity-90 hidden sm:block">
          <svg
            viewBox="0 0 160 120"
            fill="none"
            className="w-36 h-28 text-white drop-shadow-sm"
          >
            <path
              d="M142.5 18.2C130.8 28.5 113.6 37.8 96.2 38.6C82.1 39.2 70.4 34.6 60.1 27.2C50.6 20.4 42.1 11.2 31.5 5.5C28.2 3.7 24.1 2.2 20.8 4.1C18.6 5.3 18.4 8.2 19.5 10.4C24.3 20.2 34.5 28.6 44.8 34.2C53.7 39 64.2 41.5 73.6 44.7C63.2 47.9 51.5 49.8 41.2 46.8C34.7 44.9 28.3 41.3 21.6 40.2C17.4 39.5 12.8 40.8 11.2 44.8C9.8 48.2 12.5 51.7 15.6 53.6C26.5 60.4 40.3 62.1 52.8 62.8C65.4 63.5 78.4 62.2 90.5 58.4C95.2 61.5 100.2 65.2 104.5 69.8C109.8 75.5 113.2 82.8 115.8 90.2C116.8 93.1 118.2 96.2 121.2 97.4C124.6 98.8 128.2 96.7 129.5 93.4C132.8 85.1 131.2 75.2 126.8 67.5C123.6 61.9 119.1 57.2 114.2 53.1C123.8 48.2 134.1 41.5 141.2 32.8C144.5 28.8 147.2 24.1 148.8 19.1C149.2 17.8 147.6 16.2 146.4 16.5C145.1 16.8 143.7 17.4 142.5 18.2Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Far Right Slogan */}
        <div className="absolute right-8 bottom-6 text-right pointer-events-none hidden md:block">
          <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-200/80 uppercase">
            WORDS
          </p>
          <p className="text-[9px] font-semibold tracking-[0.25em] text-cyan-200/60 uppercase mt-0.5">
            FIND A VOICE
          </p>
        </div>

        {/* Banner Content */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            AI AUDIO STUDIO
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">
            Multi Speaker Studio
          </h1>
          <p className="text-cyan-100 text-sm max-w-xl font-normal">
            Create dynamic multi-voice conversations with production-ready Edge voices.
          </p>

          {/* 3 Frosted Stats Cards */}
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Speakers</p>
                <p className="text-sm font-bold text-white leading-tight">
                  {speakerOrder.length} detected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <Cpu size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Format</p>
                <p className="text-sm font-bold text-white leading-tight">MP3</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Engine</p>
                <p className="text-sm font-bold text-white leading-tight">Edge Neural</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Configuration Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-7">
        {/* Paste Conversation Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu size={18} className="text-sky-500" />
              Conversation Script
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Format: Speaker: Speech
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/20 focus:border-sky-400 transition-all">
            <textarea
              value={conversationText}
              onChange={(e) => {
                setConversationText(e.target.value);
                setMergedUrl(null);
              }}
              placeholder="Paste your script dialog here (e.g. Tom: Hello)..."
              rows="8"
              className="w-full px-5 py-4 bg-white text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Detected Speakers Section */}
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-sky-500" />
              Speaker Voice Mapping
            </h3>
            <span className="text-xs text-slate-400">
              {speakerOrder.length} {speakerOrder.length === 1 ? "speaker" : "speakers"} active
            </span>
          </div>

          {Object.keys(voiceMapping).length === 0 ? (
            <div className="p-8 text-center bg-slate-50/70 border border-slate-200/70 rounded-2xl">
              <p className="text-xs text-slate-500 font-medium">
                No speakers detected. Type conversation lines (e.g. "Tom: Hello") to configure voices.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {speakerOrder.map((speaker) => (
                <div
                  key={speaker}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 ring-4 ring-sky-100" />
                    <span className="font-bold text-slate-900 truncate text-sm">
                      {speaker}
                    </span>
                  </div>

                  <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                    {/* Language Dropdown */}
                    <div className="flex-1 relative">
                      <select
                        value={speakerLanguages[speaker] || "en"}
                        onChange={(e) =>
                          handleLanguageChange(speaker, e.target.value)
                        }
                        className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 appearance-none cursor-pointer text-xs font-semibold shadow-sm"
                      >
                        {Object.entries(localeNames).map(([locale, name]) => (
                          <option key={locale} value={locale}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>

                    {/* Voice Dropdown */}
                    <div className="flex-1 relative">
                      <select
                        value={voiceMapping[speaker] || ""}
                        onChange={(e) =>
                          handleVoiceChange(speaker, e.target.value)
                        }
                        className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 appearance-none cursor-pointer text-xs font-semibold shadow-sm truncate"
                      >
                        {voices
                          .filter((v) => v.locale.startsWith(speakerLanguages[speaker] || "en"))
                          .map((voice) => (
                            <option key={voice.shortName} value={voice.shortName}>
                              {voice.displayName} ({voice.gender})
                            </option>
                          ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trigger Button Row */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Output:</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
              MP3 • 24kHz Mono
            </span>
          </div>

          <button
            onClick={handleGenerateAudio}
            disabled={isGenerating || Object.keys(voiceMapping).length === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl font-semibold text-sm text-white shadow-md shadow-sky-500/25 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Synthesizing Dialogue..." : "▶ Generate Conversation"}
          </button>
        </div>
      </div>

      {/* Generated Audio Card */}
      {mergedUrl && (
        <div className="bg-white rounded-3xl border border-sky-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <CheckCircle className="text-sky-600" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Conversation Generated!
              </h3>
              <p className="text-xs text-slate-500">
                All speaker turns merged into a single multi-character MP3 track.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200 gap-4">
            <audio
              ref={audioRef}
              src={mergedUrl}
              controls
              className="w-full flex-1"
            />

            <a
              href={mergedUrl}
              download="merged_conversation.mp3"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all shrink-0"
            >
              <Download size={14} />
              Download MP3
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSpeaker;





  