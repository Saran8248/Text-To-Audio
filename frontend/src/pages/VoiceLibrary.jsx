import React, { useState, useRef } from "react";
import { Heart, Play, Music, Filter, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/apiHelper";
import HeroBanner from "../components/HeroBanner";

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
    { id: "en-IN-NeerjaNeural", name: "Neerja", language: "English", type: "Female", accent: "India", style: "Friendly", url: "https://example.com/neerja.wav" },
    { id: "en-US-GuyNeural", name: "Guy", language: "English", type: "Male", accent: "United States", style: "Confident", url: "https://example.com/guy.wav" },
    { id: "en-GB-RyanNeural", name: "Ryan", language: "English", type: "Male", accent: "United Kingdom", style: "Professional", url: "https://example.com/ryan.wav" },
    { id: "en-AU-WilliamNeural", name: "William", language: "English", type: "Male", accent: "Australia", style: "Warm", url: "https://example.com/william.wav" },
    { id: "en-IN-PrabhatNeural", name: "Prabhat", language: "English", type: "Male", accent: "India", style: "Natural", url: "https://example.com/prabhat.wav" },

    // French (8)
    { id: "fr-FR-DeniseNeural", name: "Denise", language: "French", type: "Female", accent: "France", style: "Natural", url: "https://example.com/denise.wav" },
    { id: "fr-CA-SylvieNeural", name: "Sylvie", language: "French", type: "Female", accent: "Canada", style: "Natural", url: "https://example.com/sylvie.wav" },
    { id: "fr-BE-CharlineNeural", name: "Charline", language: "French", type: "Female", accent: "Belgium", style: "Natural", url: "https://example.com/charline.wav" },
    { id: "fr-CH-ArianeNeural", name: "Ariane", language: "French", type: "Female", accent: "Switzerland", style: "Natural", url: "https://example.com/ariane.wav" },
    { id: "fr-FR-HenriNeural", name: "Henri", language: "French", type: "Male", accent: "France", style: "Natural", url: "https://example.com/henri.wav" },
    { id: "fr-CA-AntoineNeural", name: "Antoine", language: "French", type: "Male", accent: "Canada", style: "Natural", url: "https://example.com/antoine.wav" },
    { id: "fr-BE-GerardNeural", name: "Gerard", language: "French", type: "Male", accent: "Belgium", style: "Natural", url: "https://example.com/gerard.wav" },
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
    { id: "ar-EG-ShakirNeural", name: "Shakir", language: "Arabic", type: "Male", accent: "Egypt", style: "Natural", url: "https://example.com/shakir.wav" },
    { id: "ar-SA-HamedNeural", name: "Hamed", language: "Arabic", type: "Male", accent: "Saudi Arabia", style: "Natural", url: "https://example.com/hamed.wav" },
    { id: "ar-QA-MoazNeural", name: "Moaz", language: "Arabic", type: "Male", accent: "Qatar", style: "Natural", url: "https://example.com/moaz.wav" }
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
    stopPlayback();
    setPlayingId(voice.id);

    try {
      let sampleText = `Hello, I am ${voice.name}, ready to speak for your projects.`;
      if (voice.language === "German") {
        sampleText = `Hallo, ich bin ${voice.name}. Ich freue mich darauf, deinen Text vorzulesen.`;
      } else if (voice.language === "Tamil") {
        sampleText = `வணக்கம், நான் ${voice.name}. உங்கள் உரையை வாசிக்க நான் தயார்.`;
      } else if (voice.language === "French") {
        sampleText = `Bonjour, je suis ${voice.name}, prêt à donner vie à vos textes.`;
      } else if (voice.language === "Arabic") {
        sampleText = `مرحباً، أنا ${voice.name}، جاهز لقراءة نصوصك بصوت طبيعي.`;
      }

      const token = localStorage.getItem("terra_tern_auth_token");
      const response = await apiFetch(`/api/tts/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: sampleText,
          voice: voice.id,
        }),
      });

      const blob = await response.blob();
      const mp3Blob = new Blob([blob], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(mp3Blob);

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
      console.error("VoiceLibrary Sample Error:", err);
      let errorMessage = err.message || "Playback failed. Tap again to try.";
      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("Load failed")
      ) {
        errorMessage = "Network connection failed. Could not reach audio server.";
      }
      toast.error(errorMessage);
      stopPlayback();
    }
  };

  const filteredVoices = voices.filter((voice) => {
    if (selectedGender !== "all" && voice.type !== selectedGender) return false;
    if (selectedLanguage !== "all" && voice.language !== selectedLanguage)
      return false;
    return true;
  });

  const VoiceCard = ({ voice }) => (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition-all group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-0.5">
              {voice.name}
            </h3>
            <p className="text-xs text-slate-500">{voice.language}</p>
          </div>
          <button
            onClick={() => toggleFavorite(voice.id)}
            className={`p-2 rounded-xl transition-colors ${
              favorites.has(voice.id)
                ? "bg-rose-50 text-rose-500"
                : "bg-slate-50 text-slate-400 hover:text-rose-500"
            }`}
            title="Favorite"
          >
            <Heart
              size={16}
              fill={favorites.has(voice.id) ? "currentColor" : "none"}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[10px] font-semibold bg-sky-50 text-[#006699] px-2 py-0.5 rounded-full border border-sky-100">
            {voice.type}
          </span>
          <span className="text-[10px] font-semibold bg-teal-50 text-[#009688] px-2 py-0.5 rounded-full border border-teal-100">
            {voice.accent}
          </span>
          {voice.style && (
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {voice.style}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() =>
          playingId === voice.id ? stopPlayback() : playSample(voice)
        }
        className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl font-semibold text-white text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all"
      >
        <Play size={14} fill="white" />
        <span>{playingId === voice.id ? "Stop Sample" : "Play Sample"}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Signature Ocean-to-Teal Hero Banner */}
      <HeroBanner
        kicker="AI AUDIO STUDIO"
        title="Voice Library"
        description="Explore our curated collection of natural, production-ready Edge neural voices across 70+ languages."
        pills={[
          {
            icon: Music,
            label: "Voices",
            value: `${voices.length}+ Active`,
          },
          {
            icon: Sparkles,
            label: "Quality",
            value: "Neural HD",
          },
          {
            icon: Heart,
            label: "Favorites",
            value: `${favorites.size} saved`,
          },
        ]}
        sloganTop="EXPLORE"
        sloganBottom="FIND A VOICE"
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#006699]" />
          <h3 className="text-sm font-bold text-slate-900">Filter Voices</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Gender
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "Male", "Female"].map((gender) => (
                <button
                  key={gender}
                  onClick={() =>
                    setSelectedGender(gender === "all" ? "all" : gender)
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedGender === gender
                      ? "bg-gradient-to-r from-blue-600 to-[#006699] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {gender === "all" ? "All Genders" : gender}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Language
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                "all",
                "English",
                "German",
                "French",
                "Tamil",
                "Arabic",
              ].map((lang) => (
                <button
                  key={lang}
                  onClick={() =>
                    setSelectedLanguage(lang === "all" ? "all" : lang)
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedLanguage === lang
                      ? "bg-gradient-to-r from-blue-600 to-[#006699] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {lang === "all" ? "All Languages" : lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredVoices.map((voice, idx) => (
          <VoiceCard key={voice.id} voice={voice} index={idx} />
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Music size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-base">
            No voices match your filters
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting the gender or language selection above.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceLibrary;
