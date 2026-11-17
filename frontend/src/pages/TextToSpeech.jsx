import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Download,
  Copy,
  Trash2,
  Activity,
  FileText,
  Music2,
  User,
  Globe,
  ChevronDown,
  Lightbulb,
  Timer,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/apiHelper";
import { fallbackVoices } from "../config/voices";

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("en-US-AriaNeural");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languageCode, setLanguageCode] = useState("en");
  const [speed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setGenerationError] = useState("");
  const [, setGenerationStatus] = useState("");
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const audioRef = useRef(null);
  const sampleAudioRef = useRef(null);
  const textareaRef = useRef(null);
  const [customBreakVal, setCustomBreakVal] = useState("1.5");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const insertBreak = (seconds) => {
    const parsed = parseFloat(seconds);
    if (isNaN(parsed) || parsed <= 0) {
      toast.warning("Please enter a valid pause duration in seconds.");
      return;
    }
    const tag = `[break: ${parsed}s]`;
    const textarea = textareaRef.current;
    if (!textarea) {
      handleTextChange((text ? text + " " + tag : tag).trim());
      return;
    }
    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const prefix = before.length > 0 && !before.endsWith(" ") ? " " : "";
    const suffix = after.length > 0 && !after.startsWith(" ") ? " " : " ";
    const inserted = `${prefix}${tag}${suffix}`;
    const newText = before + inserted + after;
    handleTextChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + inserted.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const [voices, setVoices] = useState({});

  useEffect(() => {
    const grouped = fallbackVoices;
    setVoices(grouped);

    const locales = Object.keys(grouped);
    if (locales.length > 0) {
      const defaultLocale = locales.includes("en") ? "en" : locales[0];
      setSelectedLanguage(defaultLocale);
      if (grouped[defaultLocale] && grouped[defaultLocale].length > 0) {
        setSelectedVoice(grouped[defaultLocale][0].id);
      }
    }
  }, []);

  const languageDisplayNames = {
    en: "English (US)",
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "en-AU": "English (Australia)",
    "en-IN": "English (India)",
    de: "German (Germany)",
    "de-DE": "German (Germany)",
    es: "Spanish (Spain)",
    "es-ES": "Spanish (Spain)",
    fr: "French (France)",
    "fr-FR": "French (France)",
    ta: "Tamil (India)",
    "ta-IN": "Tamil (India)",
    ar: "Arabic",
  };

  const languages = Object.keys(voices).map((lang) => ({
    id: lang,
    name: languageDisplayNames[lang] || lang.toUpperCase(),
  }));

  const clearGeneratedAudio = (status = "") => {
    if (audioUrl) {
      window.URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setGenerationError("");
    setGenerationStatus(status);
  };

  const handleTextChange = (value) => {
    setText(value.slice(0, 5000));
    if (audioUrl) {
      clearGeneratedAudio("Text changed. Generate again for the updated audio.");
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (voices[lang] && voices[lang].length > 0) {
      setSelectedVoice(voices[lang][0].id);
    }
    setLanguageCode(lang.split("-")[0]);
    clearGeneratedAudio("Language changed. Generate again for the new voice.");
  };

  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    clearGeneratedAudio("Voice changed. Generate again for the new voice.");
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed, audioUrl]);

  const handleGenerateAudio = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      setGenerationError("Please enter some text to convert.");
      setGenerationStatus("");
      return;
    }

    setIsLoading(true);
    setGenerationError("");
    setGenerationStatus("Generating audio...");
    try {
      const response = await apiFetch(`/api/tts/generate`, {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          language: languageCode,
        }),
      });

      const audioBlob = await response.blob();
      const mp3Blob = new Blob([audioBlob], { type: "audio/mpeg" });
      const url = window.URL.createObjectURL(mp3Blob);
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.load();
      }
      setGenerationStatus("Audio is ready to preview or download.");
      toast.success("Audio generated successfully!");
      setIsPlaying(false);
    } catch (error) {
      console.error("TTS API Error:", error);
      let errorMessage = error.message || "Generation failed.";
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("Load failed")
      ) {
        errorMessage = "Network connection failed. Could not reach audio server.";
      }
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySample = async () => {
    if (isPlayingSample) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
      setIsPlayingSample(false);
      return;
    }

    // Try preloaded sample first
    const samplePath = `/samples/test_${selectedVoice}.mp3`;
    const audio = new Audio(samplePath);
    sampleAudioRef.current = audio;

    audio.onended = () => setIsPlayingSample(false);
    audio.onerror = async () => {
      // Fallback: Generate quick sample on the fly
      try {
        const voiceName = selectedVoice.split("-").slice(-1)[0].replace("Neural", "");
        const response = await apiFetch(`/api/tts/generate`, {
          method: "POST",
          body: JSON.stringify({
            text: `Hello, this is ${voiceName}. I am ready to speak your text.`,
            voice: selectedVoice,
            language: languageCode,
          }),
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const dynamicAudio = new Audio(url);
        sampleAudioRef.current = dynamicAudio;
        dynamicAudio.onended = () => {
          setIsPlayingSample(false);
          URL.revokeObjectURL(url);
        };
        await dynamicAudio.play();
        setIsPlayingSample(true);
      } catch (err) {
        console.error("Failed to play sample:", err);
        setIsPlayingSample(false);
        toast.info("Could not play sample for this voice.");
      }
    };

    try {
      await audio.play();
      setIsPlayingSample(true);
    } catch (e) {
      audio.onerror();
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `audio-${Date.now()}.mp3`;
    a.click();
    toast.success("Audio downloaded!");
  };

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Text copied to clipboard!");
  };

  const currentVoiceName =
    selectedVoice.split("-").slice(-1)[0].replace("Neural", "") || "Aria";

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
            stroke="url(#wave-grad)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M0,180 C250,90 550,250 1000,130"
            stroke="url(#wave-grad)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,210 C350,120 650,220 1000,160"
            stroke="url(#wave-grad)"
            strokeWidth="1.5"
            fill="none"
          />
          <defs>
            <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
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
            Text to Speech
          </h1>
          <p className="text-cyan-100 text-sm max-w-xl font-normal">
            Create clean MP3 voiceovers with production-ready Edge voices.
          </p>

          {/* 3 Frosted Stats Cards */}
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Limit</p>
                <p className="text-sm font-bold text-white leading-tight">5000 chars</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <Music2 size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Format</p>
                <p className="text-sm font-bold text-white leading-tight">MP3</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] text-cyan-200/80 uppercase font-medium">Voice</p>
                <p className="text-sm font-bold text-white leading-tight">{currentVoiceName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Your Text (Left) & Audio Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Your Text Card */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-slate-700" />
                  <h2 className="text-base font-bold text-slate-900">Your Text</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {text.length} / 5000 characters
                </span>
              </div>

              {/* Pause Helper Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5 text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
                  <Timer size={13} className="text-sky-500" />
                  Insert Pause:
                </span>
                <button
                  type="button"
                  onClick={() => insertBreak(1)}
                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                >
                  +1s
                </button>
                <button
                  type="button"
                  onClick={() => insertBreak(2)}
                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                >
                  +2s
                </button>
                <button
                  type="button"
                  onClick={() => insertBreak(3)}
                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                >
                  +3s
                </button>
                {showCustomInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      max="30"
                      value={customBreakVal}
                      onChange={(e) => setCustomBreakVal(e.target.value)}
                      className="w-12 px-1 py-0.5 text-[11px] border border-sky-300 rounded text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        insertBreak(customBreakVal);
                        setShowCustomInput(false);
                      }}
                      className="px-1.5 py-0.5 text-[11px] font-semibold bg-sky-600 text-white rounded hover:bg-sky-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-slate-400 hover:text-slate-600 px-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium transition-colors"
                  >
                    Custom...
                  </button>
                )}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Speak your mind..."
                className="w-full h-44 p-4 border border-slate-200 rounded-2xl resize-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm leading-relaxed bg-white font-sans transition-all"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                >
                  <Copy size={14} className="text-slate-500" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    clearGeneratedAudio("");
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                >
                  <Trash2 size={14} className="text-slate-500" />
                  Clear
                </button>
              </div>

              {/* Generate Audio Button */}
              <button
                type="button"
                onClick={handleGenerateAudio}
                disabled={isLoading || !text.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all ${
                  isLoading || !text.trim()
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-sky-500/25 hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    Generate Audio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Preview Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Audio Preview</h2>
              </div>

              {/* Center Audio Preview or Waveform */}
              {audioUrl ? (
                <div className="my-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          audioRef.current?.play();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 hover:scale-105 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {isPlaying ? "Playing..." : "Ready to play"}
                      </p>
                      <p className="text-[11px] text-slate-400">MP3 • {currentVoiceName}</p>
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-8"
                    controls
                  />

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download size={14} />
                    Download MP3
                  </button>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center">
                  {/* Cyan Equalizer Waveform Graphic */}
                  <div className="flex items-center justify-center gap-1 h-16 w-full max-w-xs px-4">
                    {[
                      6, 10, 14, 20, 26, 36, 48, 60, 44, 58, 72, 62, 70, 84, 68, 54, 42,
                      56, 68, 80, 60, 74, 56, 44, 34, 24, 18, 12, 8, 6,
                    ].map((heightPct, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${heightPct}%` }}
                        className="flex-1 w-1 rounded-full bg-gradient-to-t from-teal-400 to-cyan-500 opacity-75"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-3">
                    Generate audio to preview here.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Callout: Tips for better results */}
            <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 mt-4">
              <div className="flex items-center gap-1.5 text-sky-800 font-bold text-xs mb-2">
                <Lightbulb size={15} className="text-sky-600" />
                Tips for better results
              </div>
              <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Write clear and well-structured text.</li>
                <li>Use proper punctuation for natural pauses.</li>
                <li>Keep sentences concise and easy to read.</li>
                <li>Try different voices and languages to find the best fit.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Language & Voice Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Language */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Language</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 mb-3.5">
            Choose the language for your speech
          </p>

          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 pr-10 cursor-pointer shadow-sm"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Right Card: Voice */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Voice</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 mb-3.5">Select an AI voice</p>

          <div className="flex items-center gap-3">
            {/* Dropdown */}
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 pr-10 cursor-pointer shadow-sm truncate"
              >
                {voices[selectedLanguage]?.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.type || "Neural"})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Listen Sample Button */}
            <button
              type="button"
              onClick={handlePlaySample}
              className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
            >
              {isPlayingSample ? (
                <>
                  <Pause size={13} fill="currentColor" />
                  Playing...
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  Listen Sample
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
