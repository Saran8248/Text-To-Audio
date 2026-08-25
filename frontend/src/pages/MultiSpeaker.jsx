import React, { useState, useEffect, useRef } from "react";
import { Users, Cpu, CheckCircle, Download } from "lucide-react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/api";

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
    "Tom: Hallo Anna.\nAnna: Hallo Tom.\nNarrator: Beide gehen ins Restaurant.\nTom: Ich möchte Pizza.\nAnna: Ich nehme Pasta.",
  );
  const [voices, setVoices] = useState([]);
  const [voiceMapping, setVoiceMapping] = useState({});
  const [speakerLanguages, setSpeakerLanguages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [speakerOrder, setSpeakerOrder] = useState([]);

  const audioRef = useRef(null);

  useEffect(() => {
    // Fetch available voices from backend
    const fetchVoices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tts/voices`);
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
        console.error("Failed to load voices:", err);
        toast.error("Unable to retrieve voice library list. If the backend is waking up, please wait a minute and refresh.");
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

    const lines = conversationText.split("\n");
    const uniqueSpeakers = new Set();

    lines.forEach((line) => {
      const match = line.trim().match(/^([\p{L}\p{N}\s_-]+):/u);
      if (match) {
        const potentialSpeaker = match[1].trim();
        if (!/^\d+$/.test(potentialSpeaker)) {
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
            newMapping[speaker] = "de-DE-KatjaNeural";
          } else if (
            lower.includes("tom") ||
            lower.includes("male") ||
            lower.includes("boy")
          ) {
            newMapping[speaker] = "de-DE-ConradNeural";
          } else if (
            lower.includes("narrator") ||
            lower.includes("story") ||
            lower.includes("erzähler")
          ) {
            newMapping[speaker] = "de-DE-AmalaNeural";
          } else {
            newMapping[speaker] = "de-DE-KillianNeural";
          }
        }

        const voiceId = newMapping[speaker];
        const voiceObj = voices.find((v) => v.shortName === voiceId);
        const fullLocale = voiceObj ? voiceObj.locale : (voiceId.split("-").slice(0, 2).join("-") || "de");
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
      const initResponse = await fetch(`${API_BASE_URL}/api/tts/multi-speaker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: conversationText,
          voiceMapping: voiceMapping,
        }),
      });

      if (!initResponse.ok) {
        const errData = await initResponse.json().catch(() => ({}));
        throw new Error(errData.message || "Server error occurred during generation.");
      }
      
      const initData = await initResponse.json();
      const jobId = initData.jobId;
      if (!jobId) throw new Error("No job ID returned");
      
      toast.update(generateToast, { render: "Job queued. Generating audio...", type: "info", isLoading: true });
      
      let isCompleted = false;
      let attempts = 0;
      while (!isCompleted && attempts < 90) { // multi-speaker takes longer
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        const jobRes = await fetch(`${API_BASE_URL}/api/tts/jobs/${jobId}`);
        const jobData = await jobRes.json();
        
        if (jobData.status === "completed") {
          isCompleted = true;
        } else if (jobData.status === "failed") {
          throw new Error(jobData.error || "Generation failed on server");
        } else {
          toast.update(generateToast, { render: `Processing... (${jobData.status})`, type: "info", isLoading: true });
        }
      }
      
      if (!isCompleted) throw new Error("Generation timed out while waiting");

      const downloadRes = await fetch(`${API_BASE_URL}/api/tts/jobs/${jobId}/download`);
      if (!downloadRes.ok) throw new Error("Failed to download audio file");

      const audioBlob = await downloadRes.blob();
      const url = URL.createObjectURL(audioBlob);

      setMergedUrl(url);
      toast.dismiss(generateToast);
      toast.success("Conversation audio successfully generated!");
    } catch (err) {
      console.error(err);
      toast.dismiss(generateToast);
      toast.error(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-wide uppercase">
          Multi Speaker Script
        </h1>
        <p className="text-slate-600">
          Paste your dialog conversation and map distinct voices to each speaker
          dynamically.
        </p>
      </div>

      {/* Main Single Configuration Card */}
      <div
        className="glass p-8 rounded-3xl border border-slate-200 space-y-8 shadow-sm relative overflow-hidden"
      >
        {/* Paste Conversation Section */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <Cpu size={24} className="text-sky-500" />
            Script Input
          </h3>
          <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <textarea
              value={conversationText}
              onChange={(e) => {
                setConversationText(e.target.value);
                setMergedUrl(null);
              }}
              placeholder="Paste your script dialog here (e.g. Tom: Hello)..."
              rows="8"
              className="w-full px-6 py-5 bg-white rounded-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none font-mono text-sm leading-relaxed tracking-wide"
            />
          </div>
        </div>

        {/* Detected Speakers Section (Directly Downside of the Box) */}
        <div className="pt-8 border-t border-slate-200 space-y-6 relative z-10">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <Users size={24} className="text-sky-500" />
            Dialogue Blocks
          </h3>

          {Object.keys(voiceMapping).length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No speakers detected. Type conversation lines (e.g. "Tom: Hallo")
              to configure speaker voices below.
            </p>
          ) : (
            <div className="space-y-4 relative">
              <div className="absolute inset-y-0 left-5 w-[1px] bg-slate-200 -z-10" />
              {speakerOrder.map((speaker) => (
                <div
                  key={speaker}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white rounded-xl border border-slate-200 gap-6 shadow-sm"
                >
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm ring-4 ring-brand-50" />
                    <span className="font-bold text-slate-900 truncate text-lg tracking-wide">
                      {speaker}
                    </span>
                  </div>

                  <div className="flex-1 w-full max-w-lg flex flex-col sm:flex-row gap-4">
                    {/* Language Dropdown */}
                    <div className="flex-1 relative">
                      <select
                        value={speakerLanguages[speaker] || "de"}
                        onChange={(e) =>
                          handleLanguageChange(speaker, e.target.value)
                        }
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500 focus:outline-none appearance-none cursor-pointer text-sm font-medium hover:border-slate-300"
                      >
                        {Object.entries(localeNames).map(([locale, name]) => (
                          <option
                            key={locale}
                            value={locale}
                            className="bg-white text-slate-900"
                          >
                            {name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-sky-500 focus:outline-none appearance-none cursor-pointer text-sm font-medium hover:border-slate-300"
                      >
                        {voices
                          .filter((v) => v.locale.startsWith(speakerLanguages[speaker] || "de"))
                          .map((voice) => (
                            <option
                              key={voice.shortName}
                              value={voice.shortName}
                              className="bg-white text-slate-900"
                            >
                              {voice.displayName} ({voice.gender})
                            </option>
                          ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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

        {/* Audio Generating Options & Trigger Button (Directly Downside of Speaker Config) */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">
              Output Format:
            </span>
            <label className="flex items-center gap-2 text-slate-900 font-bold text-sm cursor-pointer px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <input
                type="radio"
                name="format"
                defaultChecked
                className="w-4 h-4 text-sky-500 border-slate-300 bg-white focus:ring-0 focus:ring-offset-0"
              />
              MP3
            </label>
          </div>

          <button
            onClick={handleGenerateAudio}
            disabled={isGenerating || Object.keys(voiceMapping).length === 0}
            className="w-full sm:w-auto px-10 py-4 bg-sky-500 hover:bg-sky-600 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-sm"
          >
            {isGenerating ? "Forging Audio..." : "Generate Sequence"}
          </button>
        </div>
      </div>

      {mergedUrl && (
        <div
          className="glass p-6 rounded-3xl border border-sky-200 bg-sky-50 space-y-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-brand-100 border border-sky-200 flex items-center justify-center">
              <CheckCircle className="text-sky-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Forge Complete!
              </h3>
              <p className="text-xs text-slate-600">
                All dialogue blocks merged into a unified audio artifact.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 gap-4 relative z-10 shadow-sm">
            <audio
              ref={audioRef}
              src={mergedUrl}
              controls
              className="w-full flex-1 rounded-lg"
            />

            <a
              href={mergedUrl}
              download="merged_conversation.mp3"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all shrink-0"
            >
              <Download size={16} />
              Download MP3
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSpeaker;
