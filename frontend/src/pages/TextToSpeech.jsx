import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Download,
  Copy,
  Volume2,
  AlertCircle,
  RotateCcw,
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
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const audioRef = useRef(null);

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
      const response = await apiFetch(`/api/tts/generate`, {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          language: languageCode,
        })
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
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.message?.includes("Load failed")) {
        errorMessage = "Network connection failed. Could not reach audio server.";
      }
      setGenerationError(errorMessage);
      toast.error(errorMessage);
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
      <div
        className="glass p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-50 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between relative z-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              AI audio studio
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
              Text to Speech
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Create clean MP3 voiceovers with production-ready Edge voices.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Limit</p>
              <p className="text-sm font-semibold text-slate-900">5000 chars</p>
            </div>
            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Format</p>
              <p className="text-sm font-semibold text-slate-900">MP3</p>
            </div>
            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500">Voice</p>
              <p className="text-sm font-semibold text-slate-900">
                {selectedVoice.split("-").slice(-1)[0].replace("Neural", "")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass p-6 rounded-2xl border border-slate-200 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all duration-300 relative">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <label className="text-lg font-semibold text-slate-900">
                Your Text
              </label>
              <span className="text-sm text-slate-500">
                {text.length} / 5000 characters
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Speak your mind..."
              className="w-full h-48 bg-transparent border-0 p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none font-mono tracking-wide relative z-10"
            />
            <div className="flex gap-2 mt-4 relative z-10">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Copy size={18} />
                Copy
              </button>
              <button
                onClick={() => {
                  setText("");
                  clearGeneratedAudio("");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw size={18} />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border border-slate-200">
              <label
                htmlFor="tts-language"
                className="block text-sm font-semibold text-slate-900 mb-4"
              >
                Language
              </label>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedLanguage === lang.id
                        ? "bg-sky-50 border border-sky-200 text-brand-700 font-medium"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-slate-200">
              <label
                htmlFor="tts-voice"
                className="block text-sm font-semibold text-slate-900 mb-4"
              >
                Voice
              </label>
              <div className="space-y-2">
                {voices[selectedLanguage] &&
                  voices[selectedLanguage].map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => handleVoiceChange(voice.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedVoice === voice.id
                          ? "bg-sky-50 border border-sky-200 text-brand-700 font-medium"
                          : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{voice.name}</span>
                        <span className="text-xs opacity-70">{voice.type}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-200 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-900">
                  Speed
                </label>
                <span className="text-sm text-slate-600 font-medium">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="w-full mt-4 flex items-center justify-center py-4 bg-sky-50 rounded-xl border border-sky-200 text-sky-600">
              Generating...
            </div>
          ) : (
            <button
              onClick={handleGenerateAudio}
              disabled={!text.trim()}
              className={`w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                !text.trim()
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
              }`}
            >
              <Volume2 size={20} />
              Forge Audio
            </button>
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
        </div>

        <div
          className="lg:col-span-1"
        >
          <div className="glass p-6 rounded-2xl border border-slate-200 sticky top-24 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Audio Preview</h3>

            {audioUrl ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
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
                      className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 shadow-sm flex items-center justify-center text-white transition-colors"
                    >
                      <Play size={20} fill="white" />
                    </button>
                    <span className="text-sm text-slate-600">
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

                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download MP3
                </button>

                <button
                  onClick={handleGenerateAudio}
                  disabled={isLoading || !text.trim()}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    isLoading || !text.trim()
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
                  }`}
                >
                  <Volume2 size={18} />
                  {isLoading ? "Generating..." : "Generate New Audio"}
                </button>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Voice:</span>
                    <span className="text-slate-900 font-medium">
                      {voices[selectedLanguage]?.find(
                        (v) => v.id === selectedVoice,
                      )?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Speed:</span>
                    <span className="text-slate-900 font-medium">
                      {speed.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Characters:</span>
                    <span className="text-slate-900 font-medium">
                      {text.length}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mb-4">
                  <Volume2 size={40} className="text-slate-300 mx-auto" />
                </div>
                <p className="text-slate-500">Generate audio to preview here</p>
              </div>
            )}

            <div className="glass border border-sky-200 rounded-lg p-4 space-y-2 bg-sky-50 shadow-sm">
              <div className="flex gap-2">
                <AlertCircle
                  size={18}
                  className="text-sky-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-medium text-brand-800 mb-1">Tips</p>
                  <ul className="text-xs text-brand-700/80 space-y-1">
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
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;

