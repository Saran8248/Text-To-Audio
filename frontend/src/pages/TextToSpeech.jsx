import React, { useEffect, useRef, useState } from "react";
import { motion } from "../utils/motion";
import VortexLoader from "../components/VortexLoader";
import {
  Play,
  Download,
  Copy,
  Volume2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const getErrorMessage = async (error) => {
  const fallback =
    "The hosted voice service is not ready yet. Please try again shortly or contact the site owner.";
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.message || parsed.error || fallback;
    } catch {
      return fallback;
    }
  }

  return data?.message || error.message || fallback;
};

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("en-US-AriaNeural");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languageCode, setLanguageCode] = useState("en");
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const audioRef = useRef(null);

  const [voices, setVoices] = useState({});

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch("/api/tts/voices");
        const data = await response.json();
        const grouped = data.data || {};
        setVoices(grouped);

        const locales = Object.keys(grouped);
        if (locales.length > 0) {
          const defaultLocale = locales.includes("en-US")
            ? "en-US"
            : locales[0];
          setSelectedLanguage(defaultLocale);
          if (grouped[defaultLocale] && grouped[defaultLocale].length > 0) {
            setSelectedVoice(grouped[defaultLocale][0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load voices:", err);
      }
    };
    fetchVoices();
  }, []);

  const languageNames = {
    de: "German",
    en: "English",
    es: "Spanish",
    fr: "French",
    ta: "Tamil",
    ar: "Arabic",
  };

  const languages = Object.keys(voices).map((lang) => ({
    id: lang,
    name: languageNames[lang] || lang,
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
      clearGeneratedAudio(
        "Text changed. Generate again for the updated audio.",
      );
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
      const response = await axios.post(
        `${API_BASE_URL}/api/tts/generate`,
        {
          text: text.trim(),
          voice: selectedVoice,
          language: languageCode,
        },
        {
          responseType: "blob",
          timeout: 180000,
        },
      );

      const url = window.URL.createObjectURL(response.data);
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);
      setGenerationStatus("Audio is ready to preview or download.");
      toast.success("Audio generated successfully!");
      setIsPlaying(false);
    } catch (error) {
      const message = await getErrorMessage(error);
      setGenerationError(message);
      setGenerationStatus("");
      toast.error(message);
    } finally {
      setIsLoading(false);
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
    navigator.clipboard.writeText(text);
    toast.success("Text copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark p-6 sm:p-8 rounded-2xl border border-ember-500/20 shadow-glow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-ember-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between relative z-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-crimson-400">
              AI audio studio
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-ember-50 mt-2">
              Text to Speech
            </h1>
            <p className="text-ember-400 mt-2 max-w-2xl">
              Create clean MP3 voiceovers with production-ready Edge voices.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="glass-sm px-4 py-3 rounded-xl border border-ember-500/10">
              <p className="text-xs text-ember-400">Limit</p>
              <p className="text-sm font-semibold text-ember-50">5000 chars</p>
            </div>
            <div className="glass-sm px-4 py-3 rounded-xl border border-ember-500/10">
              <p className="text-xs text-ember-400">Format</p>
              <p className="text-sm font-semibold text-ember-50">MP3</p>
            </div>
            <div className="glass-sm px-4 py-3 rounded-xl border border-ember-500/10">
              <p className="text-xs text-ember-400">Voice</p>
              <p className="text-sm font-semibold text-ember-50">
                {selectedVoice.split("-").slice(-1)[0].replace("Neural", "")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-dark p-6 rounded-2xl border border-ember-500/10 focus-within:border-ember-500/50 focus-within:shadow-glow-ember transition-all duration-500 group relative">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <label className="text-lg font-semibold text-ember-50">
                Your Text
              </label>
              <span className="text-sm text-ember-400">
                {text.length} / 5000 characters
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Speak your mind..."
              className="w-full h-48 bg-transparent border-0 p-4 text-ember-50 placeholder-ember-500/30 focus:outline-none focus:ring-0 resize-none font-mono tracking-wide relative z-10"
            />
            <div className="flex gap-2 mt-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyText}
                className="flex items-center gap-2 px-4 py-2 glass-sm border border-ember-500/20 rounded-lg text-ember-400 hover:text-ember-50 hover:border-ember-500/50 transition-colors"
              >
                <Copy size={18} />
                Copy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setText("");
                  clearGeneratedAudio("");
                }}
                className="flex items-center gap-2 px-4 py-2 glass-sm border border-ember-500/20 rounded-lg text-ember-400 hover:text-ember-50 hover:border-ember-500/50 transition-colors"
              >
                <RotateCcw size={18} />
                Clear
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-dark p-6 rounded-2xl border border-ember-500/10">
              <label
                htmlFor="tts-language"
                className="block text-sm font-semibold text-ember-50 mb-4"
              >
                Language
              </label>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedLanguage === lang.id
                        ? "bg-void-800 border border-ember-500 text-ember-50 shadow-glow-sm animate-pulse-amber"
                        : "bg-void-900/50 border border-void-700 text-void-400 hover:text-ember-400 hover:border-ember-500/30"
                    }`}
                  >
                    {lang.name}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="glass-dark p-6 rounded-2xl border border-ember-500/10">
              <label
                htmlFor="tts-voice"
                className="block text-sm font-semibold text-ember-50 mb-4"
              >
                Voice
              </label>
              <div className="space-y-2">
                {voices[selectedLanguage] &&
                  voices[selectedLanguage].map((voice) => (
                    <motion.button
                      key={voice.id}
                      onClick={() => handleVoiceChange(voice.id)}
                      whileHover={{ x: 4 }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedVoice === voice.id
                          ? "bg-void-800 border border-ember-500 text-ember-50 shadow-glow-sm animate-pulse-amber"
                          : "bg-void-900/50 border border-void-700 text-void-400 hover:text-ember-400 hover:border-ember-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs opacity-70">{voice.type}</span>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </div>
          </div>

          <div className="glass-dark p-6 rounded-2xl border border-ember-500/10 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-ember-50">
                  Speed
                </label>
                <span className="text-sm text-ember-400 font-medium">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-void-800 rounded-lg appearance-none cursor-pointer accent-ember-500"
              />
              <div className="flex justify-between text-xs text-void-500 mt-2">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="w-full mt-4">
              <VortexLoader />
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateAudio}
              disabled={!text.trim()}
              className={`w-full py-4 mt-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                !text.trim()
                  ? "bg-void-800 text-void-500 cursor-not-allowed border border-void-700"
                  : "bg-liquid-fire shadow-glow-ember hover:shadow-[0_0_30px_rgba(255,166,46,0.6)] border border-ember-400/50"
              }`}
            >
              <Volume2 size={20} />
              Forge Audio
            </motion.button>
          )}

          {(generationStatus || generationError) && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                generationError
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-green-500/30 bg-green-500/10 text-green-200"
              }`}
            >
              {generationError || generationStatus}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-dark p-6 rounded-2xl border border-ember-500/20 sticky top-24 space-y-6">
            <h3 className="text-lg font-semibold text-ember-50">Audio Preview</h3>

            {audioUrl ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          if (audioRef.current) {
                            audioRef.current.playbackRate = speed;
                          }
                          audioRef.current?.play();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                      className="w-12 h-12 rounded-full bg-liquid-fire shadow-glow-ember flex items-center justify-center text-white hover:shadow-[0_0_20px_rgba(255,166,46,0.8)]"
                    >
                      <Play size={20} fill="white" />
                    </motion.button>
                    <span className="text-sm text-ember-400">
                      {isPlaying ? "Playing..." : "Ready to play"}
                    </span>
                  </div>

                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="w-full py-3 bg-void-800 border border-ember-500/30 rounded-lg font-medium text-ember-50 hover:bg-void-700 hover:border-ember-500/50 hover:shadow-glow-sm flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download MP3
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateAudio}
                  disabled={isLoading || !text.trim()}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isLoading || !text.trim()
                      ? "bg-void-800 text-void-500 cursor-not-allowed border border-void-700"
                      : "bg-liquid-fire text-white shadow-glow-sm hover:shadow-[0_0_20px_rgba(255,166,46,0.6)] border border-ember-400/50"
                  }`}
                >
                  <Volume2 size={18} />
                  {isLoading ? "Generating..." : "Generate New Audio"}
                </motion.button>

                <div className="bg-void-900/50 border border-void-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-void-400">Voice:</span>
                    <span className="text-ember-50 font-medium">
                      {voices[selectedLanguage]?.find(
                        (v) => v.id === selectedVoice,
                      )?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-void-400">Speed:</span>
                    <span className="text-ember-50 font-medium">
                      {speed.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-void-400">Characters:</span>
                    <span className="text-ember-50 font-medium">
                      {text.length}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mb-4"
                >
                  <Volume2 size={40} className="text-void-600 mx-auto" />
                </motion.div>
                <p className="text-void-500">Generate audio to preview here</p>
              </div>
            )}

            <div className="glass-dark border border-crimson-500/20 rounded-lg p-4 space-y-2 bg-crimson-500/5 shadow-glow-sm">
              <div className="flex gap-2">
                <AlertCircle
                  size={18}
                  className="text-crimson-400 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-medium text-crimson-300 mb-1">Tips</p>
                  <ul className="text-xs text-crimson-200/60 space-y-1">
                    <li>Max 5000 characters per request</li>
                    <li>
                      Playback speed changes preview and download review only
                    </li>
                    <li>
                      Try different voices and languages for narration style
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TextToSpeech;
