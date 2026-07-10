import React, { useState, useEffect, useRef } from 'react';
import { motion } from '../utils/motion';
import { Users, Play, Pause, Download, Cpu, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const localeNames = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'en-AU': 'English (Australia)',
  'de-DE': 'German (Germany)',
  'de-AT': 'German (Austria)',
  'de-CH': 'German (Switzerland)',
  'fr-FR': 'French',
  'es-ES': 'Spanish',
  'hi-IN': 'Hindi',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'zh-CN': 'Chinese',
  'ja-JP': 'Japanese',
  'uk-UA': 'Ukrainian',
  'XTTS-v2': 'XTTS Multilingual'
};

const MultiSpeaker = () => {
  const [conversationText, setConversationText] = useState(
    "Tom: Hallo Anna.\nAnna: Hallo Tom.\nNarrator: Beide gehen ins Restaurant.\nTom: Ich möchte Pizza.\nAnna: Ich nehme Pasta."
  );
  const [voices, setVoices] = useState([]);
  const [voiceMapping, setVoiceMapping] = useState({});
  const [speakerLanguages, setSpeakerLanguages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Fetch available voices from backend
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/tts/voices');
        const data = await response.json();
        const groupedVoices = data.data || {};
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
        console.error('Failed to load voices:', err);
        toast.error('Unable to retrieve voice library list.');
      }
    };
    fetchVoices();

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

    const lines = conversationText.split('\n');
    const uniqueSpeakers = new Set();

    lines.forEach((line) => {
      const match = line.trim().match(/^([a-zA-Z0-9\s_-]+):/);
      if (match) {
        uniqueSpeakers.add(match[1].trim());
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
          if (lower.includes('anna') || lower.includes('female') || lower.includes('girl')) {
            newMapping[speaker] = 'de-DE-KatjaNeural';
          } else if (lower.includes('tom') || lower.includes('male') || lower.includes('boy')) {
            newMapping[speaker] = 'de-DE-ConradNeural';
          } else if (lower.includes('narrator') || lower.includes('story') || lower.includes('erzähler')) {
            newMapping[speaker] = 'de-DE-AmalaNeural';
          } else {
            newMapping[speaker] = 'de-DE-ChristophNeural';
          }
        }

        const voiceId = newMapping[speaker];
        const voiceObj = voices.find((v) => v.shortName === voiceId);
        newLanguages[speaker] = voiceObj ? voiceObj.locale : voiceId.split('-').slice(0, 2).join('-');
      });

      setSpeakerLanguages(newLanguages);
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
            updated[speaker] = found.locale;
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

    const localeVoices = voices.filter((v) => v.locale === newLocale);
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
      toast.warn('No speakers detected in the conversation. Format must contain "Speaker: Text".');
      return;
    }

    setIsGenerating(true);
    const generateToast = toast.loading('Generating conversation audio tracks...', { autoClose: false });

    try {
      const token = localStorage.getItem('terra_tern_auth_token');
      const response = await fetch('/api/tts/multi-speaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: conversationText,
          voiceMapping: voiceMapping,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Server error occurred during generation.');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      setMergedUrl(url);
      setIsPlaying(false);
      toast.dismiss(generateToast);
      toast.success('Conversation audio successfully generated!');
    } catch (err) {
      console.error(err);
      toast.dismiss(generateToast);
      toast.error(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">Multi Speaker Text to Audio</h1>
        <p className="text-gray-400">Paste your dialog conversation and map distinct voices to each speaker dynamically.</p>
      </motion.div>

      {/* Main Single Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10 space-y-6"
      >
        {/* Paste Conversation Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Cpu size={20} className="text-blue-400" />
            Paste Conversation
          </h3>
          <textarea
            value={conversationText}
            onChange={(e) => {
              setConversationText(e.target.value);
              setMergedUrl(null);
            }}
            placeholder="Paste your script dialog here (e.g. Tom: Hello)..."
            rows="8"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none resize-none font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Detected Speakers Section (Directly Downside of the Box) */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Detected Speakers
          </h3>

          {Object.keys(voiceMapping).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No speakers detected. Type conversation lines (e.g. "Tom: Hallo") to configure speaker voices below.</p>
          ) : (
            <div className="space-y-3">
              {Object.keys(voiceMapping).map((speaker) => (
                <div key={speaker} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 glass-sm rounded-xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-semibold text-white truncate">{speaker}</span>
                  </div>

                  <div className="flex-1 w-full max-w-lg flex flex-col sm:flex-row gap-3">
                    {/* Language Dropdown */}
                    <div className="flex-1 relative">
                      <select
                        value={speakerLanguages[speaker] || 'de-DE'}
                        onChange={(e) => handleLanguageChange(speaker, e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer text-sm"
                      >
                        {Object.entries(localeNames).map(([locale, name]) => (
                          <option key={locale} value={locale} className="bg-dark-900 text-white">
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Voice Dropdown */}
                    <div className="flex-1 relative">
                      <select
                        value={voiceMapping[speaker] || ''}
                        onChange={(e) => handleVoiceChange(speaker, e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer text-sm"
                      >
                        {voices
                          .filter((v) => v.locale === (speakerLanguages[speaker] || 'de-DE'))
                          .map((voice) => (
                            <option key={voice.shortName} value={voice.shortName} className="bg-dark-900 text-white">
                              {voice.displayName} ({voice.gender})
                            </option>
                          ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio Generating Options & Trigger Button (Directly Downside of Speaker Config) */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-medium">Output Format:</span>
            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                defaultChecked
                className="w-4 h-4 text-blue-500 border-white/10 bg-white/5 focus:ring-0 focus:ring-offset-0"
              />
              MP3
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateAudio}
            disabled={isGenerating || Object.keys(voiceMapping).length === 0}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-white hover:shadow-lg disabled:opacity-50"
          >
            {isGenerating ? 'Generating Audio...' : 'Generate Audio'}
          </motion.button>
        </div>
      </motion.div>

      {/* Merged Results Player Panel */}
      {mergedUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generation Successful!</h3>
              <p className="text-xs text-gray-400">All conversation segments merged together successfully.</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 gap-4">
            <audio
              ref={audioRef}
              src={mergedUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handlePlayToggle}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white"
            >
              {isPlaying ? <Pause size={20} /> : <Play className="ml-0.5" size={20} />}
            </motion.button>

            <div className="flex-1 text-sm font-medium text-white truncate">
              merged_conversation.mp3
            </div>

            <a
              href={mergedUrl}
              download="merged_conversation.mp3"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all"
            >
              <Download size={16} />
              Download
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MultiSpeaker;
