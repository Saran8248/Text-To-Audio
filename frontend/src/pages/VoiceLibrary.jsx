import React, { useState, useRef } from "react";
import { motion } from "../utils/motion";
import { Heart, Play, Music, Filter } from "lucide-react";
import { toast } from "react-toastify";

const VoiceLibrary = () => {
  const [favorites, setFavorites] = useState(new Set());
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const voices = [
    // German (8)
    { id: "de-DE-SeraphinaMultilingualNeural", name: "Seraphina", language: "German", type: "Female", accent: "Germany", style: "Clear", url: "https://example.com/seraphina.wav" },
    { id: "de-DE-AmalaNeural", name: "Amala", language: "German", type: "Female", accent: "Germany", style: "Warm", url: "https://example.com/amala.wav" },
    { id: "de-DE-KatjaNeural", name: "Katja", language: "German", type: "Female", accent: "Germany", style: "Soft", url: "https://example.com/katja.wav" },
    { id: "de-AT-IngridNeural", name: "Ingrid", language: "German", type: "Female", accent: "Austria", style: "Friendly", url: "https://example.com/ingrid.wav" },
    { id: "de-DE-FlorianMultilingualNeural", name: "Florian", language: "German", type: "Male", accent: "Germany", style: "Bold", url: "https://example.com/florian.wav" },
    { id: "de-DE-ConradNeural", name: "Conrad", language: "German", type: "Male", accent: "Germany", style: "Clear", url: "https://example.com/conrad.wav" },
    { id: "de-DE-KillianNeural", name: "Killian", language: "German", type: "Male", accent: "Germany", style: "Bright", url: "https://example.com/killian.wav" },
    { id: "de-AT-JonasNeural", name: "Jonas", language: "German", type: "Male", accent: "Austria", style: "Friendly", url: "https://example.com/jonas.wav" },
    
    // English (8)
    { id: "en-US-AriaNeural", name: "Aria", language: "English", type: "Female", accent: "United States", style: "Warm", url: "https://example.com/aria.wav" },
    { id: "en-GB-LibbyNeural", name: "Libby", language: "English", type: "Female", accent: "United Kingdom", style: "Natural", url: "https://example.com/libby.wav" },
    { id: "en-AU-NatashaNeural", name: "Natasha", language: "English", type: "Female", accent: "Australia", style: "Natural", url: "https://example.com/natasha.wav" },
    { id: "en-IN-NeerjaNeural", name: "Neerja", language: "English", type: "Female", accent: "India", style: "Natural", url: "https://example.com/neerja.wav" },
    { id: "en-US-GuyNeural", name: "Guy", language: "English", type: "Male", accent: "United States", style: "Natural", url: "https://example.com/guy.wav" },
    { id: "en-GB-RyanNeural", name: "Ryan", language: "English", type: "Male", accent: "United Kingdom", style: "Natural", url: "https://example.com/ryan.wav" },
    { id: "en-AU-WilliamMultilingualNeural", name: "William", language: "English", type: "Male", accent: "Australia", style: "Natural", url: "https://example.com/william.wav" },
    { id: "en-IN-PrabhatNeural", name: "Prabhat", language: "English", type: "Male", accent: "India", style: "Natural", url: "https://example.com/prabhat.wav" },

    // Spanish (8)
    { id: "es-ES-ElviraNeural", name: "Elvira", language: "Spanish", type: "Female", accent: "Spain", style: "Natural", url: "https://example.com/elvira.wav" },
    { id: "es-ES-XimenaNeural", name: "Ximena", language: "Spanish", type: "Female", accent: "Spain", style: "Natural", url: "https://example.com/ximena.wav" },
    { id: "es-MX-DaliaNeural", name: "Dalia", language: "Spanish", type: "Female", accent: "Mexico", style: "Natural", url: "https://example.com/dalia.wav" },
    { id: "es-US-PalomaNeural", name: "Paloma", language: "Spanish", type: "Female", accent: "United States", style: "Natural", url: "https://example.com/paloma.wav" },
    { id: "es-ES-AlvaroNeural", name: "Alvaro", language: "Spanish", type: "Male", accent: "Spain", style: "Natural", url: "https://example.com/alvaro.wav" },
    { id: "es-MX-JorgeNeural", name: "Jorge", language: "Spanish", type: "Male", accent: "Mexico", style: "Natural", url: "https://example.com/jorge.wav" },
    { id: "es-US-AlonsoNeural", name: "Alonso", language: "Spanish", type: "Male", accent: "United States", style: "Natural", url: "https://example.com/alonso.wav" },
    { id: "es-CO-GonzaloNeural", name: "Gonzalo", language: "Spanish", type: "Male", accent: "Colombia", style: "Natural", url: "https://example.com/gonzalo.wav" },

    // French (8)
    { id: "fr-FR-DeniseNeural", name: "Denise", language: "French", type: "Female", accent: "France", style: "Natural", url: "https://example.com/denise.wav" },
    { id: "fr-FR-EloiseNeural", name: "Eloise", language: "French", type: "Female", accent: "France", style: "Natural", url: "https://example.com/eloise.wav" },
    { id: "fr-FR-VivienneMultilingualNeural", name: "Vivienne", language: "French", type: "Female", accent: "France", style: "Natural", url: "https://example.com/vivienne.wav" },
    { id: "fr-CA-SylvieNeural", name: "Sylvie", language: "French", type: "Female", accent: "Canada", style: "Natural", url: "https://example.com/sylvie.wav" },
    { id: "fr-FR-HenriNeural", name: "Henri", language: "French", type: "Male", accent: "France", style: "Natural", url: "https://example.com/henri.wav" },
    { id: "fr-FR-RemyMultilingualNeural", name: "Remy", language: "French", type: "Male", accent: "France", style: "Natural", url: "https://example.com/remy.wav" },
    { id: "fr-CA-AntoineNeural", name: "Antoine", language: "French", type: "Male", accent: "Canada", style: "Natural", url: "https://example.com/antoine.wav" },
    { id: "fr-CH-FabriceNeural", name: "Fabrice", language: "French", type: "Male", accent: "Switzerland", style: "Natural", url: "https://example.com/fabrice.wav" },

    // Tamil (8)
    { id: "ta-IN-PallaviNeural", name: "Pallavi", language: "Tamil", type: "Female", accent: "India", style: "Natural", url: "https://example.com/pallavi.wav" },
    { id: "ta-SG-VenbaNeural", name: "Venba", language: "Tamil", type: "Female", accent: "Singapore", style: "Natural", url: "https://example.com/venba.wav" },
    { id: "ta-MY-KaniNeural", name: "Kani", language: "Tamil", type: "Female", accent: "Malaysia", style: "Natural", url: "https://example.com/kani.wav" },
    { id: "ta-LK-SaranyaNeural", name: "Saranya", language: "Tamil", type: "Female", accent: "Sri Lanka", style: "Natural", url: "https://example.com/saranya.wav" },
    { id: "ta-IN-ValluvarNeural", name: "Valluvar", language: "Tamil", type: "Male", accent: "India", style: "Natural", url: "https://example.com/valluvar.wav" },
    { id: "ta-SG-AnbuNeural", name: "Anbu", language: "Tamil", type: "Male", accent: "Singapore", style: "Natural", url: "https://example.com/anbu.wav" },
    { id: "ta-MY-SuryaNeural", name: "Surya", language: "Tamil", type: "Male", accent: "Malaysia", style: "Natural", url: "https://example.com/surya.wav" },
    { id: "ta-LK-KumarNeural", name: "Kumar", language: "Tamil", type: "Male", accent: "Sri Lanka", style: "Natural", url: "https://example.com/kumar.wav" },

    // Arabic (8)
    { id: "ar-AE-FatimaNeural", name: "Fatima", language: "Arabic", type: "Female", accent: "UAE", style: "Natural", url: "https://example.com/fatima.wav" },
    { id: "ar-EG-SalmaNeural", name: "Salma", language: "Arabic", type: "Female", accent: "Egypt", style: "Natural", url: "https://example.com/salma.wav" },
    { id: "ar-SA-ZariyahNeural", name: "Zariyah", language: "Arabic", type: "Female", accent: "Saudi Arabia", style: "Natural", url: "https://example.com/zariyah.wav" },
    { id: "ar-QA-AmalNeural", name: "Amal", language: "Arabic", type: "Female", accent: "Qatar", style: "Natural", url: "https://example.com/amal.wav" },
    { id: "ar-AE-HamdanNeural", name: "Hamdan", language: "Arabic", type: "Male", accent: "UAE", style: "Natural", url: "https://example.com/hamdan.wav" },
    { id: "ar-EG-ShakirNeural", name: "Shakir", type: "Male", accent: "Egypt", style: "Natural", url: "https://example.com/shakir.wav" },
    { id: "ar-SA-HamedNeural", name: "Hamed", type: "Male", accent: "Saudi Arabia", style: "Natural", url: "https://example.com/hamed.wav" },
    { id: "ar-QA-MoazNeural", name: "Moaz", type: "Male", accent: "Qatar", style: "Natural", url: "https://example.com/moaz.wav" }
  ];

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
      toast.info("Removed from favorites");
    } else {
      newFavorites.add(id);
      toast.success("Added to favorites");
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
      stopPlayback();
      setPlayingId(voice.id);

      // Generate localized text based on the language
      let sampleText = `Hello! I am ${voice.name}. How does my voice sound?`;
      const langLower = (voice.language || "").toLowerCase();
      if (langLower.includes("german")) {
        sampleText = `Hallo! Ich bin ${voice.name}. Wie klingt meine Stimme?`;
      } else if (langLower.includes("spanish")) {
        sampleText = `¡Hola! Soy ${voice.name}. ¿Cómo suena mi voz?`;
      } else if (langLower.includes("french")) {
        sampleText = `Bonjour! Je m'appelle ${voice.name}. Comment sonne ma voix?`;
      } else if (langLower.includes("tamil")) {
        sampleText = `வணக்கம்! என் பெயர் ${voice.name}. என் குரல் எப்படி இருக்கிறது?`;
      } else if (langLower.includes("arabic")) {
        sampleText = `مرحباً! أنا ${voice.name}. كيف يبدو صوتي؟`;
      }

      // Fetch dynamic audio from backend
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sampleText,
          voice: voice.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice sample");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      const a = new Audio(audioUrl);
      audioRef.current = a;

      a.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      const playPromise = a.play();
      if (playPromise !== undefined) {
        await playPromise;
        toast.success(`Playing sample for ${voice.name}`);
      }
    } catch (err) {
      console.error("Playback error", err);
      toast.error("Playback failed. Tap again to try.");
      stopPlayback();
    }
  };

  const filteredVoices = voices.filter((voice) => {
    if (selectedGender !== "all" && voice.type !== selectedGender) return false;
    if (selectedLanguage !== "all" && voice.language !== selectedLanguage)
      return false;
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
              ? "bg-red-500/20 text-red-400"
              : "bg-white/5 text-gray-400 hover:text-red-400"
          }`}
        >
          <Heart
            size={20}
            fill={favorites.has(voice.id) ? "currentColor" : "none"}
          />
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
        onClick={() =>
          playingId === voice.id ? stopPlayback() : playSample(voice)
        }
        className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group-hover:shadow-lg"
      >
        <Play size={16} fill="white" />
        {playingId === voice.id ? "Stop" : "Play Sample"}
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
        <p className="text-gray-400">
          Choose from our collection of natural-sounding voices
        </p>
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
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Gender
            </label>
            <div className="flex gap-2 flex-wrap">
              {["all", "Male", "Female"].map((gender) => (
                <motion.button
                  key={gender}
                  onClick={() =>
                    setSelectedGender(gender === "all" ? "all" : gender)
                  }
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedGender === gender
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {gender === "all" ? "All" : gender}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Language
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                "all",
                "English (US)",
                "English (UK)",
                "English (AU)",
                "German",
                "French",
                "Tamil",
                "Arabic (UAE)",
              ].map((lang) => (
                <motion.button
                  key={lang}
                  onClick={() =>
                    setSelectedLanguage(lang === "all" ? "all" : lang)
                  }
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLanguage === lang
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {lang === "all" ? "All" : lang}
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
