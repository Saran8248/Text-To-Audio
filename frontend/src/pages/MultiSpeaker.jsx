import React, { useState, useEffect, useRef } from 'react';
import { motion } from '../utils/motion';
import { Users, Play, Pause, Download, Volume2, Cpu, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const MultiSpeaker = () => {
  const [conversationText, setConversationText] = useState(
    "Tom: Hallo Anna.\nAnna: Hallo Tom.\nNarrator: Beide gehen ins Restaurant.\nTom: Ich möchte Pizza.\nAnna: Ich nehme Pasta."
  );
  const [voices, setVoices] = useState([]);
  const [voiceMapping, setVoiceMapping] = useState({});
  const [detected, setDetected] = useState(false);
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
        setVoices(data.data || []);
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

  const handleDetectSpeakers = () => {
    if (!conversationText.trim()) {
      toast.warn('Please paste or write a conversation first.');
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
    if (speakerList.length === 0) {
      toast.warn('Could not detect any speaker prefixes. Format should be "Name: Speech Text".');
      return;
    }

    // Auto-map speakers intelligently
    const mapping = {};
    speakerList.forEach((speaker) => {
      const lower = speaker.toLowerCase();
      if (lower.includes('anna') || lower.includes('female') || lower.includes('girl')) {
        mapping[speaker] = 'de-DE-KatjaNeural';
      } else if (lower.includes('tom') || lower.includes('male') || lower.includes('boy')) {
        mapping[speaker] = 'de-DE-ConradNeural';
      } else if (lower.includes('narrator') || lower.includes('story') || lower.includes('erzähler')) {
        mapping[speaker] = 'de-DE-AmalaNeural';
      } else {
        // Fallback default
        mapping[speaker] = 'de-DE-ChristophNeural';
      }
    });

    setVoiceMapping(mapping);
    setDetected(true);
    toast.success(`Successfully detected ${speakerList.length} speakers!`);
  };

  const handleVoiceChange = (speaker, voiceId) => {
    setVoiceMapping((prev) => ({
      ...prev,
      [speaker]: voiceId,
    }));
  };



  const handleGenerateAudio = async () => {
    if (Object.keys(voiceMapping).length === 0) {
      toast.warn('Please detect speakers and assign voices first.');
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
        <p className="text-gray-400">Generate conversations using different voices mapped to each speaker.</p>
      </motion.div>

      {/* Main UI Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Step 1: Input text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu size={20} className="text-blue-400" />
            Paste Conversation
          </h3>
          <div className="space-y-4">
            <textarea
              value={conversationText}
              onChange={(e) => {
                setConversationText(e.target.value);
                setDetected(false);
                setMergedUrl(null);
              }}
              placeholder="Paste dialogs here..."
              rows="8"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDetectSpeakers}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <Users size={16} />
                Detect Speakers
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Detected Speakers mapping options */}
        {detected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border border-white/10 space-y-6"
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pb-4 border-b border-white/5">
              <Volume2 size={20} className="text-blue-400" />
              Detected Speakers Configuration
            </h3>

            <div className="space-y-4">
              {Object.keys(voiceMapping).map((speaker) => (
                <div key={speaker} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 glass-sm rounded-xl border border-white/5 hover:border-white/10 transition-all gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="font-semibold text-white">{speaker}</span>
                  </div>

                  <div className="flex-1 flex gap-2 w-full max-w-md relative">
                    {/* Voice selector Dropdown */}
                    <div className="w-full relative">
                      <select
                        value={voiceMapping[speaker]}
                        onChange={(e) => handleVoiceChange(speaker, e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-400 focus:outline-none appearance-none cursor-pointer"
                      >
                        {voices.map((voice) => (
                          <option key={voice.shortName} value={voice.shortName} className="bg-dark-900 text-white">
                            {voice.displayName} ({voice.locale.split('-')[1]} - {voice.gender})
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

            {/* Output configuration */}
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
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-white hover:shadow-lg disabled:opacity-50"
              >
                {isGenerating ? 'Generating Audio...' : 'Generate Audio'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Screen 3: Merged Audio player container */}
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
                <p className="text-xs text-gray-400">All audio clips merged together successfully.</p>
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
    </div>
  );
};

export default MultiSpeaker;
