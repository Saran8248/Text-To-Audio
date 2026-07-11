import React, { useEffect, useRef, useState } from 'react';
import { motion } from '../utils/motion';
import { Play, Download, Copy, Volume2, Zap, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getErrorMessage = async (error) => {
  const fallback = 'The hosted voice service is not ready yet. Please try again shortly or contact the site owner.';
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
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [languageCode, setLanguageCode] = useState('en');
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const audioRef = useRef(null);

  const [voices, setVoices] = useState({});

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/tts/voices');
        const data = await response.json();
        const grouped = data.data || {};
        setVoices(grouped);

        const locales = Object.keys(grouped);
        if (locales.length > 0) {
          const defaultLocale = locales.includes('en-US') ? 'en-US' : locales[0];
          setSelectedLanguage(defaultLocale);
          if (grouped[defaultLocale] && grouped[defaultLocale].length > 0) {
            setSelectedVoice(grouped[defaultLocale][0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load voices:', err);
      }
    };
    fetchVoices();
  }, []);

  const languageNames = {
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'en-AU': 'English (Australia)',
    'de-DE': 'German (Germany)',
    'fr-FR': 'French (France)',
    'es-ES': 'Spanish (Spain)',
    'ta-IN': 'Tamil (India)',
    'ar-AE': 'Arabic (UAE)',
  };

  const languages = Object.keys(voices).map((lang) => ({
    id: lang,
    name: languageNames[lang] || lang,
  }));

  const clearGeneratedAudio = (status = '') => {
    if (audioUrl) {
      window.URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsPlaying(false);
    setGenerationError('');
    setGenerationStatus(status);
  };

  const handleTextChange = (value) => {
    setText(value.slice(0, 5000));
    if (audioUrl) {
      clearGeneratedAudio('Text changed. Generate again for the updated audio.');
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (voices[lang] && voices[lang].length > 0) {
      setSelectedVoice(voices[lang][0].id);
    }
    setLanguageCode(lang.split('-')[0]);
    clearGeneratedAudio('Language changed. Generate again for the new voice.');
  };

  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    clearGeneratedAudio('Voice changed. Generate again for the new voice.');
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
      toast.error('Please enter some text to convert');
      setGenerationError('Please enter some text to convert.');
      setGenerationStatus('');
      return;
    }

    setIsLoading(true);
    setGenerationError('');
    setGenerationStatus('Generating audio...');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tts/generate`, {
        text: text.trim(),
        voice: selectedVoice,
        language: languageCode,
      }, {
        responseType: 'blob',
        timeout: 180000,
      });

      const url = window.URL.createObjectURL(response.data);
      if (audioUrl) {
        window.URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);
      setGenerationStatus('Audio is ready to preview or download.');
      toast.success('Audio generated successfully!');
      setIsPlaying(false);
    } catch (error) {
      const message = await getErrorMessage(error);
      setGenerationError(message);
      setGenerationStatus('');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${Date.now()}.mp3`;
    a.click();
    toast.success('Audio downloaded!');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    toast.success('Text copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 sm:p-8 rounded-2xl border border-white/10"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">AI audio studio</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">Text to Speech</h1>
            <p className="text-gray-400 mt-2 max-w-2xl">Create clean MP3 voiceovers with production-ready Edge voices.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="glass-sm px-4 py-3 rounded-xl">
              <p className="text-xs text-gray-400">Limit</p>
              <p className="text-sm font-semibold text-white">5000 chars</p>
            </div>
            <div className="glass-sm px-4 py-3 rounded-xl">
              <p className="text-xs text-gray-400">Format</p>
              <p className="text-sm font-semibold text-white">MP3</p>
            </div>
            <div className="glass-sm px-4 py-3 rounded-xl">
              <p className="text-xs text-gray-400">Voice</p>
              <p className="text-sm font-semibold text-white">{selectedVoice.split('-').slice(-1)[0].replace('Neural', '')}</p>
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
          <div className="glass p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-white">Your Text</label>
              <span className="text-sm text-gray-400">{text.length} / 5000 characters</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter or paste your text here..."
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyText}
                className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20"
              >
                <Copy size={18} />
                Copy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setText('');
                  clearGeneratedAudio('');
                }}
                className="flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20"
              >
                <RotateCcw size={18} />
                Clear
              </motion.button>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border border-white/10">
              <label htmlFor="tts-language" className="block text-sm font-semibold text-white mb-4">Language</label>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedLanguage === lang.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {lang.name}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/10">
              <label htmlFor="tts-voice" className="block text-sm font-semibold text-white mb-4">Voice</label>
              <div className="space-y-2">
                {voices[selectedLanguage] && voices[selectedLanguage].map((voice) => (
                  <motion.button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice.id)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
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

          <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-white">Speed</label>
                <span className="text-sm text-blue-400 font-medium">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateAudio}
            disabled={isLoading || !text.trim()}
            className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              isLoading || !text.trim()
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30'
            }`}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap size={20} />
                </motion.div>
                Generating...
              </>
            ) : (
              <>
                <Volume2 size={20} />
                Generate Audio
              </>
            )}
          </motion.button>

          {(generationStatus || generationError) && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                generationError
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-green-500/30 bg-green-500/10 text-green-200'
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
          <div className="glass p-6 rounded-2xl border border-white/10 sticky top-24 space-y-6">
            <h3 className="text-lg font-semibold text-white">Audio Preview</h3>

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
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <Play size={20} fill="white" />
                    </motion.button>
                    <span className="text-sm text-gray-400">
                      {isPlaying ? 'Playing...' : 'Ready to play'}
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
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download MP3
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateAudio}
                  disabled={isLoading || !text.trim()}
                  className={`w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
                    isLoading || !text.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                  <Volume2 size={18} />
                  {isLoading ? 'Generating...' : 'Generate New Audio'}
                </motion.button>

                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Voice:</span>
                    <span className="text-white font-medium">
                      {voices[selectedLanguage]?.find((v) => v.id === selectedVoice)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white font-medium">{speed.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Characters:</span>
                    <span className="text-white font-medium">{text.length}</span>
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
                  <Volume2 size={40} className="text-gray-600 mx-auto" />
                </motion.div>
                <p className="text-gray-400">Generate audio to preview here</p>
              </div>
            )}

            <div className="glass-sm border border-white/5 rounded-lg p-4 space-y-2 bg-blue-500/10">
              <div className="flex gap-2">
                <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-300 mb-1">Tips</p>
                  <ul className="text-xs text-blue-200/80 space-y-1">
                    <li>Max 5000 characters per request</li>
                    <li>Playback speed changes preview and download review only</li>
                    <li>Try different voices and languages for narration style</li>
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
