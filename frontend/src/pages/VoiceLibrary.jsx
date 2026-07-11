import React, { useState, useRef } from 'react';
import { motion } from '../utils/motion';
import { Heart, Play, Music, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const VoiceLibrary = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const voices = [
    { id: 'en-US-JennyNeural', name: 'Jenny', language: 'English (US)', type: 'Female', accent: 'American', style: 'Soft', url: 'https://example.com/jenny.wav' },
    { id: 'en-US-GuyNeural', name: 'Guy', language: 'English (US)', type: 'Male', accent: 'American', style: 'Bold', url: 'https://example.com/guy.wav' },
    { id: 'en-US-AriaNeural', name: 'Aria', language: 'English (US)', type: 'Female', accent: 'American', style: 'Warm', url: 'https://example.com/aria.wav' },
    { id: 'en-US-EricNeural', name: 'Eric', language: 'English (US)', type: 'Male', accent: 'American', style: 'Clear', url: 'https://example.com/eric.wav' },
    { id: 'en-US-AvaNeural', name: 'Ava', language: 'English (US)', type: 'Female', accent: 'American', style: 'Soft', url: 'https://example.com/ava.wav' },
    { id: 'en-US-EmmaNeural', name: 'Emma', language: 'English (US)', type: 'Female', accent: 'American', style: 'Public Speaker', url: 'https://example.com/emma.wav' },
    { id: 'en-US-BrianNeural', name: 'Brian', language: 'English (US)', type: 'Male', accent: 'American', style: 'Warm', url: 'https://example.com/brian.wav' },
    { id: 'en-US-ChristopherNeural', name: 'Christopher', language: 'English (US)', type: 'Male', accent: 'American', style: 'Deep', url: 'https://example.com/christopher.wav' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia', language: 'English (UK)', type: 'Female', accent: 'British', style: 'Soft', url: 'https://example.com/sonia.wav' },
    { id: 'en-GB-RyanNeural', name: 'Ryan', language: 'English (UK)', type: 'Male', accent: 'British', style: 'Bold', url: 'https://example.com/ryan.wav' },
    { id: 'en-GB-LibbyNeural', name: 'Libby', language: 'English (UK)', type: 'Female', accent: 'British', style: 'Warm', url: 'https://example.com/libby.wav' },
    { id: 'en-GB-MaisieNeural', name: 'Maisie', language: 'English (UK)', type: 'Female', accent: 'British', style: 'Bright', url: 'https://example.com/maisie.wav' },
    { id: 'en-GB-PoppyNeural', name: 'Poppy', language: 'English (UK)', type: 'Female', accent: 'British', style: 'Clear', url: 'https://example.com/poppy.wav' },
    { id: 'en-GB-ThomasNeural', name: 'Thomas', language: 'English (UK)', type: 'Male', accent: 'British', style: 'Deep', url: 'https://example.com/thomas.wav' },
    { id: 'en-GB-OliverNeural', name: 'Oliver', language: 'English (UK)', type: 'Male', accent: 'British', style: 'Smooth', url: 'https://example.com/oliver.wav' },
    { id: 'en-GB-JamesNeural', name: 'James', language: 'English (UK)', type: 'Male', accent: 'British', style: 'Warm', url: 'https://example.com/james.wav' },
    { id: 'en-AU-NatashaNeural', name: 'Natasha', language: 'English (AU)', type: 'Female', accent: 'Australian', style: 'Soft', url: 'https://example.com/natasha.wav' },
    { id: 'en-AU-WilliamMultilingualNeural', name: 'William', language: 'English (AU)', type: 'Male', accent: 'Australian', style: 'Clear', url: 'https://example.com/william.wav' },
    { id: 'de-DE-KatjaNeural', name: 'Katja', language: 'German', type: 'Female', accent: 'Germany', style: 'Soft', url: 'https://example.com/katja.wav' },
    { id: 'de-DE-ConradNeural', name: 'Conrad', language: 'German', type: 'Male', accent: 'Germany', style: 'Clear', url: 'https://example.com/conrad.wav' },
    { id: 'de-DE-AmalaNeural', name: 'Amala', language: 'German', type: 'Female', accent: 'Germany', style: 'Warm', url: 'https://example.com/amala.wav' },
    { id: 'de-DE-FlorianMultilingualNeural', name: 'Florian', language: 'German', type: 'Male', accent: 'Germany', style: 'Bold', url: 'https://example.com/florian.wav' },
    { id: 'de-DE-KillianNeural', name: 'Killian', language: 'German', type: 'Male', accent: 'Germany', style: 'Bright', url: 'https://example.com/killian.wav' },
    { id: 'de-DE-SeraphinaMultilingualNeural', name: 'Seraphina', language: 'German', type: 'Female', accent: 'Germany', style: 'Clear', url: 'https://example.com/seraphina.wav' },
    { id: 'de-DE-LaraNeural', name: 'Lara', language: 'German', type: 'Female', accent: 'Germany', style: 'Soft', url: 'https://example.com/lara.wav' },
    { id: 'de-DE-FelixNeural', name: 'Felix', language: 'German', type: 'Male', accent: 'Germany', style: 'Clear', url: 'https://example.com/felix.wav' },
    { id: 'de-DE-GretaNeural', name: 'Greta', language: 'German', type: 'Female', accent: 'Germany', style: 'Natural', url: 'https://example.com/greta.wav' },
    { id: 'de-AT-IngridNeural', name: 'Ingrid', language: 'German', type: 'Female', accent: 'Austria', style: 'Friendly', url: 'https://example.com/ingrid.wav' },
    { id: 'de-AT-JonasNeural', name: 'Jonas', language: 'German', type: 'Male', accent: 'Austria', style: 'Friendly', url: 'https://example.com/jonas.wav' },
    { id: 'de-CH-LeniNeural', name: 'Leni', language: 'German', type: 'Female', accent: 'Switzerland', style: 'Soft', url: 'https://example.com/leni.wav' },
    { id: 'de-CH-JanNeural', name: 'Jan', language: 'German', type: 'Male', accent: 'Switzerland', style: 'Clear', url: 'https://example.com/jan.wav' },
    { id: 'fr-FR-DeniseNeural', name: 'Denise', language: 'French', type: 'Female', accent: 'French', style: 'Soft', url: 'https://example.com/denise.wav' },
    { id: 'fr-FR-HenriNeural', name: 'Henri', language: 'French', type: 'Male', accent: 'French', style: 'Clear', url: 'https://example.com/henri.wav' },
    { id: 'fr-FR-EloiseNeural', name: 'Eloise', language: 'French', type: 'Female', accent: 'French', style: 'Warm', url: 'https://example.com/eloise.wav' },
    { id: 'fr-FR-RemyMultilingualNeural', name: 'Remy', language: 'French', type: 'Male', accent: 'French', style: 'Bold', url: 'https://example.com/remy.wav' },
    { id: 'fr-FR-VivienneMultilingualNeural', name: 'Vivienne', language: 'French', type: 'Female', accent: 'French', style: 'Bright', url: 'https://example.com/vivienne.wav' },
    { id: 'ja-JP-NanamiNeural', name: 'Nanami', language: 'Japanese', type: 'Female', accent: 'Japanese', style: 'Soft', url: 'https://example.com/nanami.wav' },
    { id: 'ja-JP-KeitaNeural', name: 'Keita', language: 'Japanese', type: 'Male', accent: 'Japanese', style: 'Clear', url: 'https://example.com/keita.wav' },
    { id: 'uk-UA-PolinaNeural', name: 'Polina', language: 'Ukrainian', type: 'Female', accent: 'Ukrainian', style: 'Soft', url: 'https://example.com/polina.wav' },
    { id: 'uk-UA-OstapNeural', name: 'Ostap', language: 'Ukrainian', type: 'Male', accent: 'Ukrainian', style: 'Clear', url: 'https://example.com/ostap.wav' },
  ];

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
      toast.info('Removed from favorites');
    } else {
      newFavorites.add(id);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
  };

  const audioRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);

  const stopPlayback = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  const playSample = async (voice) => {
    try {
      // stop any existing playback
      stopPlayback();
      // If URL is a placeholder/example or missing, fallback to SpeechSynthesis
      const isPlaceholder = !voice.url || voice.url.includes('example.com');
      if (isPlaceholder || typeof window === 'undefined' || !('Audio' in window)) {
        // Fallback: use Web Speech API to produce a short sample phrase
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(`Sample voice ${voice.name}`);
          // optional: map some basic language hints
          if (voice.language && voice.language.toLowerCase().includes('german')) utter.lang = 'de-DE';
          if (voice.language?.toLowerCase().includes('french')) utter.lang = 'fr-FR';
          if (voice.language?.toLowerCase().includes('japanese')) utter.lang = 'ja-JP';
          if (voice.language?.toLowerCase().includes('ukrainian')) utter.lang = 'uk-UA';
          if (voice.language?.toLowerCase().includes('english (au)')) utter.lang = 'en-AU';
          if (voice.language?.toLowerCase().includes('english (uk)')) utter.lang = 'en-GB';
          if (voice.language?.toLowerCase().includes('english (us)')) utter.lang = 'en-US';

          setPlayingId(voice.id);
          audioRef.current = { synth: true };
          utter.onend = () => {
            setPlayingId(null);
            audioRef.current = null;
          };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
          toast.success('Playing sample audio (synth)');
          return;
        }
      }

      // create and play new audio (user gesture required)
      const a = new Audio(voice.url);
      audioRef.current = a;
      setPlayingId(voice.id);

      a.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      const playPromise = a.play();
      if (playPromise !== undefined) {
        await playPromise;
        toast.success('Playing sample audio');
      } else {
        toast.success('Playing sample audio');
      }
    } catch (err) {
      console.error('Playback error', err);
      toast.error('Playback failed. Tap again to try.');
      stopPlayback();
    }
  };

  const filteredVoices = voices.filter((voice) => {
    if (selectedGender !== 'all' && voice.type !== selectedGender) return false;
    if (selectedLanguage !== 'all' && voice.language !== selectedLanguage) return false;
    return true;
  });

  const VoiceCard = ({ voice, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{voice.name}</h3>
          <p className="text-sm text-gray-400">{voice.language}</p>
        </div>
        <motion.button
          onClick={() => toggleFavorite(voice.id)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className={`p-2 rounded-lg transition-colors ${
            favorites.has(voice.id)
              ? 'bg-red-500/20 text-red-400'
              : 'bg-white/5 text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart size={20} fill={favorites.has(voice.id) ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
            {voice.type}
          </span>
          <span className="text-xs font-medium bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
            {voice.accent}
          </span>
          {voice.style && (
            <span className="text-xs font-medium bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
              {voice.style}
            </span>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (playingId === voice.id ? stopPlayback() : playSample(voice))}
        className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group-hover:shadow-lg"
      >
        <Play size={16} fill="white" />
        {playingId === voice.id ? 'Stop' : 'Play Sample'}
      </motion.button>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Voice Library</h1>
        <p className="text-gray-400">Choose from our collection of natural-sounding voices</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Gender</label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'Male', 'Female'].map((gender) => (
                <motion.button
                  key={gender}
                  onClick={() => setSelectedGender(gender === 'all' ? 'all' : gender)}
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedGender === gender
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {gender === 'all' ? 'All' : gender}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Language</label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'English (US)', 'English (UK)', 'English (AU)', 'German', 'French', 'Japanese', 'Ukrainian'].map((lang) => (
                <motion.button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang === 'all' ? 'all' : lang)}
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLanguage === lang
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {lang === 'all' ? 'All' : lang}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredVoices.map((voice, idx) => (
          <VoiceCard key={voice.id} voice={voice} index={idx} />
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Music size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No voices match your filters</p>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceLibrary;
