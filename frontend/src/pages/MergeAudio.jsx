import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileAudio,
  Play,
  Pause,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle,
  RefreshCw,
  Layers,
  Sliders,
  Music,
} from "lucide-react";
import { toast } from "react-toastify";
import HeroBanner from "../components/HeroBanner";

// Waveform visual canvas renderer
const AudioWaveform = ({ buffer }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!buffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#009688"; // Match signature teal

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(
        i,
        ((1 + min) * height) / 2,
        1,
        Math.max(1, ((max - min) * height) / 2),
      );
    }
  }, [buffer]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={40}
      className="w-full h-10 opacity-75"
    />
  );
};

const MergeAudio = () => {
  const fileInputRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [crossfade, setCrossfade] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(2);
  const [isMerging, setIsMerging] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mergedBlob, setMergedBlob] = useState(null);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files) => {
    const audioFiles = files.filter((file) => file.type.startsWith("audio/"));
    if (audioFiles.length === 0) {
      toast.error("Please upload valid audio files (.mp3, .wav, etc.)");
      return;
    }

    const toastId = toast.loading("Decoding audio tracks...");
    const newTracks = [];

    // Create an audio context for decoding
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContextClass();

    try {
      for (const file of audioFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        newTracks.push({
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          duration: audioBuffer.duration,
          buffer: audioBuffer,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        });
      }

      setTracks((prev) => [...prev, ...newTracks]);
      toast.dismiss(toastId);
      toast.success(`Imported ${newTracks.length} track(s) successfully!`);
    } catch (error) {
      console.error("Audio Decode Error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to decode one or more audio files.");
    } finally {
      audioCtx.close();
    }
  };

  const deleteTrack = (id) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl);
      setMergedUrl(null);
      setMergedBlob(null);
    }
  };

  const moveTrack = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const updated = [...tracks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTracks(updated);

    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl);
      setMergedUrl(null);
      setMergedBlob(null);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  // Helper to convert AudioBuffer to WAV blob
  const bufferToWave = (abuffer, len) => {
    let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      out = new DataView(new ArrayBuffer(length)),
      channels = [],
      i,
      sample,
      offset = 0,
      pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // clamp sample between -1 and 1
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        // scale to 16-bit signed int
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: "audio/wav" });

    function setUint16(data) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      out.setUint32(pos, data, true);
      pos += 4;
    }
  };

  const handleMerge = async () => {
    if (tracks.length < 2) {
      toast.warn("Add at least 2 tracks to merge.");
      return;
    }

    setIsMerging(true);
    const mergeToast = toast.loading("Merging audio files together...");

    try {
      // Calculate total duration and build OfflineAudioContext
      let totalDuration = 0;
      const sampleRate = tracks[0].buffer.sampleRate;
      const numChannels = Math.max(
        ...tracks.map((t) => t.buffer.numberOfChannels),
      );
      const activeFade = crossfade ? parseFloat(crossfadeDuration) : 0;

      tracks.forEach((track, idx) => {
        if (idx === 0) {
          totalDuration += track.duration;
        } else {
          totalDuration += track.duration - activeFade;
        }
      });

      // Clamp totalDuration to ensure positive values
      totalDuration = Math.max(0.1, totalDuration);

      const offlineCtx = new OfflineAudioContext(
        numChannels,
        sampleRate * totalDuration,
        sampleRate,
      );

      let currentOffset = 0;
      tracks.forEach((track, idx) => {
        const source = offlineCtx.createBufferSource();
        source.buffer = track.buffer;

        const gainNode = offlineCtx.createGain();
        source.connect(gainNode);
        gainNode.connect(offlineCtx.destination);

        const startTime = currentOffset;
        const endTime = startTime + track.duration;

        // Apply crossfade automation
        if (activeFade > 0) {
          // Fade In (except first track)
          if (idx > 0) {
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(1, startTime + activeFade);
          } else {
            gainNode.gain.setValueAtTime(1, startTime);
          }

          // Fade Out (except last track)
          if (idx < tracks.length - 1) {
            const fadeOutStart = endTime - activeFade;
            gainNode.gain.setValueAtTime(1, fadeOutStart);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
          }
        }

        source.start(startTime);
        currentOffset = endTime - activeFade;
      });

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
      const url = URL.createObjectURL(wavBlob);

      setMergedBlob(wavBlob);
      setMergedUrl(url);

      toast.dismiss(mergeToast);
      toast.success("Tracks successfully merged!");
    } catch (err) {
      console.error("Audio Merge Error:", err);
      toast.dismiss(mergeToast);
      toast.error("Failed to merge audio files.");
    } finally {
      setIsMerging(false);
    }
  };

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const calculateTrackTimeline = (index) => {
    let start = 0;
    const activeFade = crossfade ? parseFloat(crossfadeDuration) : 0;

    for (let i = 0; i < index; i++) {
      start += tracks[i].duration - activeFade;
    }

    const end = start + tracks[index].duration;
    return `${formatDuration(start)} – ${formatDuration(end)} (${formatDuration(tracks[index].duration)})`;
  };

  const resetAll = () => {
    setTracks([]);
    setMergedBlob(null);
    setMergedUrl(null);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Signature Ocean-to-Teal Hero Banner */}
      <HeroBanner
        kicker="AI AUDIO STUDIO"
        title="Merge Audio"
        description="Combine audio clips sequentially into a single high-quality file with professional crossfade."
        pills={[
          {
            icon: Layers,
            label: "Tracks",
            value: tracks.length > 0 ? `${tracks.length} loaded` : "0 files",
          },
          {
            icon: Sliders,
            label: "Crossfade",
            value: crossfade ? `${crossfadeDuration}s Fade` : "Direct Join",
          },
          {
            icon: Music,
            label: "Output Format",
            value: "WAV / MP3",
          },
        ]}
        sloganTop="HARMONY"
        sloganBottom="MERGE TRACKS"
      />

      {/* Screen 1: File Uploader */}
      {tracks.length === 0 ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 bg-white ${
            dragActive
              ? "border-sky-500 bg-sky-50/50 shadow-md scale-[1.01]"
              : "border-slate-200 hover:border-[#006699]"
          }`}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-100 flex items-center justify-center mb-5 text-[#006699]">
            <Upload size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Merge Audio Files Online — Join Tracks Free
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm">
            Select or drag & drop audio clips to combine them sequentially into a single file with custom crossfade.
          </p>
          <button
            type="button"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold shadow-md shadow-sky-500/20 transition-all text-sm"
          >
            Select Audio Files
          </button>
        </div>
      ) : (
        /* Screen 2: Track Editor & Merger */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={crossfade}
                  onChange={(e) => setCrossfade(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#006699] focus:ring-sky-500/20"
                />
                Crossfade (seconds):
              </label>
              {crossfade && (
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={crossfadeDuration}
                    onChange={(e) =>
                      setCrossfadeDuration(parseFloat(e.target.value))
                    }
                    className="w-28 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#006699]"
                  />
                  <span className="text-xs font-bold text-[#006699] min-w-8">
                    {crossfadeDuration}s
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
              >
                + Add Track
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-all"
              >
                <RefreshCw size={13} />
                Reset
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Track List */}
          <div className="space-y-3">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm group hover:border-sky-300 transition-all"
              >
                {/* Delete Button */}
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="p-2 border border-red-100 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                  title="Remove track"
                >
                  <Trash2 size={16} />
                </button>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileAudio size={16} className="text-[#006699]" />
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {track.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {track.size}
                    </span>
                  </div>

                  {/* Waveform Drawing */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1 h-11 flex items-center">
                    <AudioWaveform buffer={track.buffer} />
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    {calculateTrackTimeline(idx)}
                  </div>
                </div>

                {/* Reordering Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveTrack(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveTrack(idx, 1)}
                    disabled={idx === tracks.length - 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Trigger Button */}
          {!mergedUrl && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleMerge}
                disabled={isMerging || tracks.length < 2}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-semibold text-white text-sm shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                {isMerging ? "Merging Audio Tracks..." : "Merge Tracks"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Merged Results Panel */}
      {mergedUrl && (
        <div className="bg-white rounded-3xl border border-teal-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#009688]">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Merge Completed Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Your merged audio track is ready for playback and download.
              </p>
            </div>
          </div>

          {/* Custom audio player */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
            <audio
              ref={audioRef}
              src={mergedUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={handlePlayToggle}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 transition-all shrink-0"
            >
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play className="ml-0.5" size={18} />
              )}
            </button>

            <div className="flex-1 text-xs font-semibold text-slate-900 truncate">
              Merged-Audio-{tracks.length}-Tracks.wav
            </div>

            <div className="flex gap-3">
              <a
                href={mergedUrl}
                download={`merged-audio-${Date.now()}.wav`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition-all"
              >
                <Download size={14} />
                Download WAV
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeAudio;
