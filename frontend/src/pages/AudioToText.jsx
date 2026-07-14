import React, { useState, useRef, useEffect } from "react";
import { motion } from "../utils/motion";
import {
  Upload,
  FileAudio,
  Copy,
  Download,
  CheckCircle,
  Play,
  Pause,
  Filter,
  RefreshCw,
  Clock,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const AudioToText = () => {
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // States
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [transcriptData, setTranscriptData] = useState(null);

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Export & Filter states
  const [selectedSpeaker, setSelectedSpeaker] = useState("all");
  const [downloadType, setDownloadType] = useState("txt");

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Handle file selections
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (selectedFile) => {
    if (!selectedFile.type.startsWith("audio/")) {
      toast.error("Please upload a valid audio file.");
      return;
    }
    setFile(selectedFile);
    setTranscriptData(null);
    setSelectedSpeaker("all");
    
    // Revoke old URL if playing
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setIsPlaying(false);
    }
    setAudioUrl(URL.createObjectURL(selectedFile));
  };

  // Submit file to backend transcription service
  const handleTranscribe = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setProgressStatus("Uploading file to server...");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      // Step simulated progress updates
      const statuses = [
        "Analyzing audio file size...",
        "Slicing audio at silent intervals...",
        "Sending speech segments to recognizer...",
        "Extracting speaker acoustic signatures...",
        "Running speaker classification algorithm...",
        "Finalizing timestamps and assembling text..."
      ];
      
      let step = 0;
      const progressInterval = setInterval(() => {
        if (step < statuses.length) {
          setProgressStatus(statuses[step]);
          step++;
        } else {
          clearInterval(progressInterval);
        }
      }, 5000);

      const response = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      
      if (response.data && response.data.data) {
        setTranscriptData(response.data.data);
        toast.success("Transcription complete!");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to transcribe audio. Please try again."
      );
    } finally {
      setIsTranscribing(false);
      setProgressStatus("");
    }
  };

  // Playback control
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Copy to clipboard
  const handleCopyAll = () => {
    if (!transcriptData) return;
    
    const filteredSegments = transcriptData.segments.filter(
      (seg) => selectedSpeaker === "all" || seg.speaker === selectedSpeaker
    );

    const fullText = filteredSegments
      .map((seg) => {
        if (transcriptData.is_monologue) {
          return seg.text;
        }
        return `${seg.speaker} [${formatTime(seg.start)} - ${formatTime(seg.end)}]: ${seg.text}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(fullText);
    toast.success("Transcript copied to clipboard!");
  };

  // Exporters (PDF, Word/DOCX, Plain Text, PPT)
  const handleDownload = () => {
    if (!transcriptData) return;

    const filteredSegments = transcriptData.segments.filter(
      (seg) => selectedSpeaker === "all" || seg.speaker === selectedSpeaker
    );

    const formattedFileName = `transcript_${selectedSpeaker === "all" ? "full" : selectedSpeaker.toLowerCase().replace(" ", "_")}`;

    if (downloadType === "txt") {
      // 1. Plain Text
      const text = filteredSegments
        .map((seg) => {
          if (transcriptData.is_monologue) return seg.text;
          return `${seg.speaker} [${formatTime(seg.start)} - ${formatTime(seg.end)}]: ${seg.text}`;
        })
        .join("\n\n");

      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      triggerBlobDownload(blob, `${formattedFileName}.txt`);
      
    } else if (downloadType === "doc") {
      // 2. Microsoft Word Document
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Transcription</title><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } h2 { color: #2563eb; } .meta { color: #666; font-size: 12px; margin-bottom: 20px; }</style></head><body><h2>Transcription Output</h2><div class="meta">File: ${file?.name || "Audio File"}<br/>Type: ${transcriptData.is_monologue ? "Monologue" : "Conversation"}</div>`;
      const footer = "</body></html>";
      
      let body = "";
      filteredSegments.forEach((seg) => {
        if (transcriptData.is_monologue) {
          body += `<p>${seg.text}</p>`;
        } else {
          body += `<p><b>${seg.speaker}</b> <span style="color:#777; font-size:11px;">[${formatTime(seg.start)} - ${formatTime(seg.end)}]</span><br/>${seg.text}</p>`;
        }
      });

      const html = header + body + footer;
      const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
      triggerBlobDownload(blob, `${formattedFileName}.doc`);

    } else if (downloadType === "ppt") {
      // 3. PPT Presentation Outline
      let pptText = `AUDIO TRANSCRIPTION PRESENTATION OUTLINE\nFile: ${file?.name || "Audio File"}\n\n`;
      filteredSegments.forEach((seg, idx) => {
        pptText += `Slide ${idx + 1}\n`;
        if (!transcriptData.is_monologue) {
          pptText += `Speaker: ${seg.speaker} (${formatTime(seg.start)} - ${formatTime(seg.end)})\n`;
        } else {
          pptText += `Section ${idx + 1} (${formatTime(seg.start)} - ${formatTime(seg.end)})\n`;
        }
        pptText += `Content Outline:\n- ${seg.text}\n\n---------------------------------\n\n`;
      });

      const blob = new Blob([pptText], { type: "text/plain;charset=utf-8" });
      triggerBlobDownload(blob, `${formattedFileName}_presentation_outline.txt`);

    } else if (downloadType === "pdf") {
      // 4. PDF (Leverages browser print system for standard system save)
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Transcription PDF Export - ${file?.name || "Audio File"}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #0f172a; }
              .meta { font-size: 13px; color: #64748b; margin-bottom: 30px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
              .segment { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
              .speaker { font-weight: bold; color: #2563eb; font-size: 15px; }
              .time { font-size: 12px; color: #64748b; margin-left: 8px; font-weight: normal; }
              .text { margin-top: 6px; font-size: 14px; color: #334155; }
              @media print {
                body { padding: 20px; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Audio Transcription Report</h1>
            <div class="meta">
              <strong>Source File:</strong> ${file?.name || "Uploaded Audio"}<br/>
              <strong>Type:</strong> ${transcriptData.is_monologue ? "Monologue Transcript" : "Speaker Diarized Conversation"}
            </div>
            ${filteredSegments
              .map(
                (seg) => `
              <div class="segment">
                <div>
                  <span class="speaker">${transcriptData.is_monologue ? "Transcript Segment" : seg.speaker}</span>
                  <span class="time">[${formatTime(seg.start)} - ${formatTime(seg.end)}]</span>
                </div>
                <div class="text">${seg.text}</div>
              </div>
            `
              )
              .join("")}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Triggered PDF printing/download dialog!");
    }
  };

  const triggerBlobDownload = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileName.toUpperCase().split(".").pop()} successfully!`);
  };

  // Get list of unique speakers found
  const getSpeakers = () => {
    if (!transcriptData) return [];
    const speakers = new Set();
    transcriptData.segments.forEach((seg) => {
      if (seg.speaker) speakers.add(seg.speaker);
    });
    return Array.from(speakers).sort();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audio to Text Conversion</h1>
          <p className="text-gray-400">
            Upload conversation or monologue audio files and transcribe them with automated speaker diarization.
          </p>
        </div>
      </div>

      {!transcriptData && !isTranscribing ? (
        /* Screen 1: File Uploader */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-blue-400 bg-blue-500/5 shadow-2xl scale-[1.01]"
              : "border-white/10 bg-white/5 hover:border-white/20"
          }`}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <Upload className="text-blue-400" size={28} />
          </div>
          {file ? (
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {file.name}
              </h3>
              <p className="text-gray-400 mb-6">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                  className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 text-white font-medium text-sm transition-all"
                >
                  Change Audio File
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTranscribe();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/20 text-white font-semibold text-sm transition-all"
                >
                  Start Transcription
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Select Audio File for Speech Recognition
              </h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Drag and drop your audio clip (.mp3, .wav, .m4a) here, or click to browse local files.
              </p>
              <button
                type="button"
                className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
              >
                Select Audio File
              </button>
            </div>
          )}
        </motion.div>
      ) : isTranscribing ? (
        /* Screen 2: Transcribing Loader */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-20 glass rounded-3xl border border-white/10"
        >
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-purple-500 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Converting Speech to Text</h3>
          <p className="text-blue-400 font-medium animate-pulse">{progressStatus}</p>
          <p className="text-xs text-gray-500 mt-4 max-w-xs text-center">
            This might take up to a minute depending on your audio length. Please keep this tab open.
          </p>
        </motion.div>
      ) : (
        /* Screen 3: Results Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Transcript Display Box */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl border border-white/10 flex flex-col h-[520px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <FileAudio className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white truncate max-w-[200px] sm:max-w-md">
                      {file?.name || "Transcription Result"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {transcriptData.is_monologue ? "Monologue Transcript" : "Multiple Speakers Diarized"}
                    </p>
                  </div>
                </div>

                {audioUrl && (
                  <div>
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-400 border border-blue-500/30 transition-all"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      className="hidden"
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>
                )}
              </div>

              {/* Transcript Text List Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {transcriptData.segments.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">No speech detected in this audio file.</p>
                ) : (
                  transcriptData.segments
                    .filter((seg) => selectedSpeaker === "all" || seg.speaker === selectedSpeaker)
                    .map((seg, idx) => (
                      <div key={idx} className="flex gap-4 items-start group">
                        {/* Avatar */}
                        {!transcriptData.is_monologue && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1 ${
                            seg.speaker === "Speaker 1"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                              : "bg-gradient-to-r from-purple-500 to-pink-500"
                          }`}>
                            <User size={14} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Timing and Speaker Header */}
                          <div className="flex items-center gap-2 mb-1">
                            {!transcriptData.is_monologue && (
                              <span className="text-xs font-bold text-white">{seg.speaker}</span>
                            )}
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                              <Clock size={10} />
                              {formatTime(seg.start)} - {formatTime(seg.end)}
                            </span>
                          </div>
                          
                          {/* Text bubble */}
                          <p className="text-sm text-gray-300 bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl leading-relaxed">
                            {seg.text}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Side Controls Boxes */}
          <div className="space-y-6">
            {/* Box 1: Exporter Control */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-6 rounded-3xl border border-white/10 space-y-4"
            >
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Download size={18} className="text-blue-400" />
                Export & Download
              </h3>
              
              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-medium">Export Document Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "pdf", name: "PDF Document" },
                    { id: "doc", name: "Word (DOC)" },
                    { id: "txt", name: "Plain Text" },
                    { id: "ppt", name: "PPT Outline" }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setDownloadType(type.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        downloadType === type.id
                          ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-inner"
                          : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleCopyAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-medium text-white transition-colors"
                >
                  <Copy size={16} />
                  Copy Selected Text
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 font-bold text-white transition-all"
                >
                  <Download size={16} />
                  Download File
                </button>
              </div>
            </motion.div>

            {/* Box 2: Speaker Filter Selection (Shows only for multi-speaker/conversation audio) */}
            {!transcriptData.is_monologue && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6 rounded-3xl border border-white/10 space-y-4"
              >
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Filter size={18} className="text-purple-400" />
                  Speaker Filter
                </h3>
                <p className="text-xs text-gray-400">
                  Select a speaker to isolate their text in the display and download.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSpeaker("all")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedSpeaker === "all"
                        ? "bg-purple-500/10 border-purple-500 text-purple-400"
                        : "border-white/5 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span>All Speakers (Full Text)</span>
                    {selectedSpeaker === "all" && <CheckCircle size={16} />}
                  </button>

                  {getSpeakers().map((spk) => (
                    <button
                      key={spk}
                      onClick={() => setSelectedSpeaker(spk)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        selectedSpeaker === spk
                          ? "bg-purple-500/10 border-purple-500 text-purple-400"
                          : "border-white/5 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span>Only {spk}</span>
                      {selectedSpeaker === spk && <CheckCircle size={16} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                setFile(null);
                setTranscriptData(null);
              }}
              className="w-full py-3 rounded-2xl glass hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Transcribe Another Audio File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioToText;
