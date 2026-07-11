import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "../utils/motion";
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
} from "lucide-react";
import { toast } from "react-toastify";

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
    ctx.fillStyle = "#60a5fa"; // Blue-400

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
      className="w-full h-10 opacity-70"
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

  // Convert File to AudioBuffer
  const getAudioBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const audioCtx = new (
            window.AudioContext || window.webkitAudioContext
          )();
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFiles = async (fileList) => {
    const audioFiles = fileList.filter((file) =>
      file.type.startsWith("audio/"),
    );
    if (audioFiles.length === 0) {
      toast.error("Please select valid audio files.");
      return;
    }

    const loadingToast = toast.loading("Decoding audio tracks...");

    const newTracks = [];
    for (const file of audioFiles) {
      try {
        const buffer = await getAudioBuffer(file);
        newTracks.push({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          duration: buffer.duration,
          buffer: buffer,
          file: file,
        });
      } catch (err) {
        console.error(err);
        toast.error(`Error loading track: ${file.name}`);
      }
    }

    toast.dismiss(loadingToast);
    if (newTracks.length > 0) {
      setTracks((prev) => [...prev, ...newTracks]);
      toast.success(`${newTracks.length} track(s) added.`);
      setMergedBlob(null);
      setMergedUrl(null);
    }
  };

  const deleteTrack = (id) => {
    setTracks(tracks.filter((t) => t.id !== id));
    setMergedBlob(null);
    setMergedUrl(null);
  };

  const moveTrack = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tracks.length) return;

    const updatedTracks = [...tracks];
    const temp = updatedTracks[index];
    updatedTracks[index] = updatedTracks[newIndex];
    updatedTracks[newIndex] = temp;

    setTracks(updatedTracks);
    setMergedBlob(null);
    setMergedUrl(null);
  };

  // Convert AudioBuffer to WAV format
  const bufferToWav = (buffer) => {
    let numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
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
    setUint32(16); // chunk length
    setUint16(1); // sample format (raw)
    setUint16(numOfChan); // channel count
    setUint32(buffer.sampleRate); // sample rate
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate (sample rate * block align)
    setUint16(numOfChan * 2); // block align (channel count * bytes per sample)
    setUint16(16); // bits per sample

    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next sample
    }

    return new Blob([bufferArr], { type: "audio/wav" });

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
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
            gainNode.gain.setValueAtTime(1, endTime - activeFade);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
          }
        } else {
          gainNode.gain.setValueAtTime(1, startTime);
        }

        source.start(startTime);

        // Advance start time offset for next track
        currentOffset += track.duration - activeFade;
      });

      const renderedBuffer = await offlineCtx.startRendering();
      const finalBlob = bufferToWav(renderedBuffer);
      const url = URL.createObjectURL(finalBlob);

      setMergedBlob(finalBlob);
      setMergedUrl(url);
      toast.dismiss(mergeToast);
      toast.success("Audio files successfully merged!");
    } catch (err) {
      console.error(err);
      toast.dismiss(mergeToast);
      toast.error("An error occurred during audio merging.");
    } finally {
      setIsMerging(false);
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

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Merge Audio</h1>
          <p className="text-gray-400">
            Combine audio clips sequentially into a single file with
            professional crossfade.
          </p>
        </div>
        {tracks.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={resetAll}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-all"
          >
            <RefreshCw size={15} />
            Reset All
          </motion.button>
        )}
      </motion.div>

      {/* Screen 1: File Uploader */}
      {tracks.length === 0 ? (
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
            multiple
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
            <Upload className="text-blue-400" size={28} />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            Merge Audio Files Online - Join Tracks Free
          </h3>
          <p className="text-gray-400 mb-6 max-w-sm">
            Select or Drag & Drop audio clips to combine them one after another
            into a single file.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            Select Audio Files
          </motion.button>
        </motion.div>
      ) : (
        /* Screen 2: Track Editor & Merger */
        <div className="space-y-6">
          {/* Controls Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 glass rounded-2xl border border-white/10 gap-4"
          >
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 font-medium">
                <input
                  type="checkbox"
                  checked={crossfade}
                  onChange={(e) => setCrossfade(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0"
                />
                Crossfade (seconds):
              </label>
              {crossfade && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={crossfadeDuration}
                    onChange={(e) =>
                      setCrossfadeDuration(parseFloat(e.target.value))
                    }
                    className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs font-semibold text-blue-400 min-w-8">
                    {crossfadeDuration}s
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current.click()}
                className="flex-1 sm:flex-none px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-medium text-white transition-colors"
              >
                + Add Track
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>

          {/* Track List */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {tracks.map((track, idx) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  layout
                  className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/10 group"
                >
                  {/* Delete Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={() => deleteTrack(track.id)}
                    className="p-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-xl hover:bg-red-500/15"
                  >
                    <Trash2 size={16} />
                  </motion.button>

                  {/* Track Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileAudio size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-white truncate">
                        {track.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {track.size}
                      </span>
                    </div>

                    {/* Waveform Drawing */}
                    <div className="bg-white/5 border border-white/5 rounded-lg p-1 h-12 flex items-center">
                      <AudioWaveform buffer={track.buffer} />
                    </div>

                    <div className="text-[11px] text-gray-400 mt-1">
                      {calculateTrackTimeline(idx)}
                    </div>
                  </div>

                  {/* Reordering Controls */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => moveTrack(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => moveTrack(idx, 1)}
                      disabled={idx === tracks.length - 1}
                      className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Merge Trigger Button */}
          {!mergedUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMerge}
                disabled={isMerging || tracks.length < 2}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 font-medium text-white hover:shadow-lg disabled:opacity-50"
              >
                {isMerging ? "Merging Audio..." : "Merge Tracks"}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* Screen 3: Merged Results Panel */}
      {mergedUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Merge Completed successfully!
              </h3>
              <p className="text-xs text-gray-400">
                Your single merged audio track is ready for download.
              </p>
            </div>
          </div>

          {/* Custom audio player */}
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
              {isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play className="ml-0.5" size={20} />
              )}
            </motion.button>

            <div className="flex-1 text-sm font-medium text-white truncate">
              Merged-Audio-{tracks.length}-Tracks.wav
            </div>

            <div className="flex gap-3">
              <a
                href={mergedUrl}
                download={`merged-audio-${Date.now()}.wav`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                <Download size={16} />
                Download
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MergeAudio;
