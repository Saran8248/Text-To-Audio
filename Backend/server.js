const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const cors = require("cors");
const { MongoClient } = require("mongodb");

let cachedUsers = null;

const app = express();
const edgeTtsScript = path.join(__dirname, "edge_tts_generator.py");
const xttsScript = path.join(__dirname, "xtts_generator.py");
const frontendBuildDir = path.join(__dirname, "..", "frontend", "build");

function getPythonCandidates() {
  return [...new Set([
    process.env.PYTHON_EXECUTABLE,
    "python3.12",
    "python3.11",
    "python3.10",
    "python3",
    "python",
  ].filter(Boolean))];
}

function canImportModule(executable, moduleName) {
  const result = spawnSync(executable, ["-c", `import ${moduleName}`], {
    windowsHide: true,
    timeout: 5000,
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolvePythonExecutable(requiredModule) {
  const candidates = getPythonCandidates();
  if (!requiredModule) {
    return candidates[0] || null;
  }
  return candidates.find((candidate) => canImportModule(candidate, requiredModule)) || null;
}

const defaultPythonExecutable = resolvePythonExecutable("edge_tts") || resolvePythonExecutable();
let edgeVoiceSet = null;

// Configuration
const CACHE_DIR = path.join(__dirname, "cache");
const HISTORY_FILE = path.join(__dirname, "history.json");
const USERS_FILE = path.join(__dirname, "users.json");
const MAX_TEXT_LENGTH = 5000;
const REQUEST_TIMEOUT = 120000; // 2 minutes
const REQUIRE_ADMIN_APPROVAL = String(process.env.REQUIRE_ADMIN_APPROVAL || "true").toLowerCase() === "true";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const isProduction = process.env.NODE_ENV === "production";

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Voice mapping
const voiceMap = {
  "en-US-JennyNeural": "en-US-JennyNeural",
  "en-US-GuyNeural": "en-US-GuyNeural",
  "en-US-AriaNeural": "en-US-AriaNeural",
  "en-US-EricNeural": "en-US-EricNeural",
  "en-US-AvaNeural": "en-US-AvaNeural",
  "en-US-AvaMultilingualNeural": "en-US-AvaMultilingualNeural",
  "en-US-AndrewNeural": "en-US-AndrewNeural",
  "en-US-AndrewMultilingualNeural": "en-US-AndrewMultilingualNeural",
  "en-US-AmandaMultilingualNeural": "en-US-AmandaMultilingualNeural",
  "en-US-AdamMultilingualNeural": "en-US-AdamMultilingualNeural",
  "en-US-EmmaNeural": "en-US-EmmaNeural",
  "en-US-EmmaMultilingualNeural": "en-US-EmmaMultilingualNeural",
  "en-US-PhoebeMultilingualNeural": "en-US-PhoebeMultilingualNeural",
  "en-US-BrianNeural": "en-US-BrianNeural",
  "en-US-BrianMultilingualNeural": "en-US-BrianMultilingualNeural",
  "en-US-ChristopherNeural": "en-US-ChristopherNeural",
  "en-US-MichelleNeural": "en-US-MichelleNeural",
  "en-US-RogerNeural": "en-US-RogerNeural",
  "en-US-SteffanNeural": "en-US-SteffanNeural",
  "en-GB-SoniaNeural": "en-GB-SoniaNeural",
  "en-GB-RyanNeural": "en-GB-RyanNeural",
  "en-GB-LibbyNeural": "en-GB-LibbyNeural",
  "en-GB-AbbiNeural": "en-GB-AbbiNeural",
  "en-GB-AlfieNeural": "en-GB-AlfieNeural",
  "en-GB-BellaNeural": "en-GB-BellaNeural",
  "en-GB-ElliotNeural": "en-GB-ElliotNeural",
  "en-GB-EthanNeural": "en-GB-EthanNeural",
  "en-GB-HollieNeural": "en-GB-HollieNeural",
  "en-GB-MaisieNeural": "en-GB-MaisieNeural",
  "en-GB-NoahNeural": "en-GB-NoahNeural",
  "en-GB-OliviaNeural": "en-GB-OliviaNeural",
  "en-GB-PoppyNeural": "en-GB-PoppyNeural",
  "en-GB-ThomasNeural": "en-GB-ThomasNeural",
  "en-GB-OliverNeural": "en-GB-OliverNeural",
  "en-GB-JamesNeural": "en-GB-JamesNeural",
  "de-DE-KatjaNeural": "de-DE-KatjaNeural",
  "de-DE-ConradNeural": "de-DE-ConradNeural",
  "de-DE-AmalaNeural": "de-DE-AmalaNeural",
  "de-DE-BerndNeural": "de-DE-BerndNeural",
  "de-DE-ChristophNeural": "de-DE-ChristophNeural",
  "de-DE-ElkeNeural": "de-DE-ElkeNeural",
  "de-DE-GiselaNeural": "de-DE-GiselaNeural",
  "de-DE-FlorianMultilingualNeural": "de-DE-FlorianMultilingualNeural",
  "de-DE-KasperNeural": "de-DE-KasperNeural",
  "de-DE-KillianNeural": "de-DE-KillianNeural",
  "de-DE-KlarissaNeural": "de-DE-KlarissaNeural",
  "de-DE-KlausNeural": "de-DE-KlausNeural",
  "de-DE-LouisaNeural": "de-DE-LouisaNeural",
  "de-DE-MajaNeural": "de-DE-MajaNeural",
  "de-DE-RalfNeural": "de-DE-RalfNeural",
  "de-DE-TanjaNeural": "de-DE-TanjaNeural",
  "de-DE-SeraphinaMultilingualNeural": "de-DE-SeraphinaMultilingualNeural",
  "fr-FR-DeniseNeural": "fr-FR-DeniseNeural",
  "fr-FR-HenriNeural": "fr-FR-HenriNeural",
  "fr-FR-EloiseNeural": "fr-FR-EloiseNeural",
  "fr-FR-RemyMultilingualNeural": "fr-FR-RemyMultilingualNeural",
  "fr-FR-VivienneMultilingualNeural": "fr-FR-VivienneMultilingualNeural",
  "fr-FR-LucienMultilingualNeural": "fr-FR-LucienMultilingualNeural",
  "fr-FR-AlainNeural": "fr-FR-AlainNeural",
  "fr-FR-BrigitteNeural": "fr-FR-BrigitteNeural",
  "fr-FR-CelesteNeural": "fr-FR-CelesteNeural",
  "fr-FR-ClaudeNeural": "fr-FR-ClaudeNeural",
  "fr-FR-CoralieNeural": "fr-FR-CoralieNeural",
  "fr-FR-JacquelineNeural": "fr-FR-JacquelineNeural",
  "fr-FR-JeromeNeural": "fr-FR-JeromeNeural",
  "fr-FR-JosephineNeural": "fr-FR-JosephineNeural",
  "fr-FR-MauriceNeural": "fr-FR-MauriceNeural",
  "fr-FR-YvesNeural": "fr-FR-YvesNeural",
  "fr-FR-YvetteNeural": "fr-FR-YvetteNeural",
  "es-ES-ElviraNeural": "es-ES-ElviraNeural",
  "es-ES-AlvaroNeural": "es-ES-AlvaroNeural",
  "es-ES-ArabellaMultilingualNeural": "es-ES-ArabellaMultilingualNeural",
  "es-ES-IsidoraMultilingualNeural": "es-ES-IsidoraMultilingualNeural",
  "es-ES-TristanMultilingualNeural": "es-ES-TristanMultilingualNeural",
  "es-ES-XimenaMultilingualNeural": "es-ES-XimenaMultilingualNeural",
  "es-ES-AbrilNeural": "es-ES-AbrilNeural",
  "es-ES-ArnauNeural": "es-ES-ArnauNeural",
  "es-ES-DarioNeural": "es-ES-DarioNeural",
  "es-ES-EstrellaNeural": "es-ES-EstrellaNeural",
  "es-ES-IreneNeural": "es-ES-IreneNeural",
  "es-ES-LaiaNeural": "es-ES-LaiaNeural",
  "es-ES-LiaNeural": "es-ES-LiaNeural",
  "es-ES-NilNeural": "es-ES-NilNeural",
  "es-ES-SaulNeural": "es-ES-SaulNeural",
  "es-ES-TeoNeural": "es-ES-TeoNeural",
  "es-ES-TrianaNeural": "es-ES-TrianaNeural",
  "es-ES-VeraNeural": "es-ES-VeraNeural",
  "es-ES-XimenaNeural": "es-ES-XimenaNeural",
  "hi-IN-AaravNeural": "hi-IN-AaravNeural",
  "hi-IN-AnanyaNeural": "hi-IN-AnanyaNeural",
  "hi-IN-AartiNeural": "hi-IN-AartiNeural",
  "hi-IN-ArjunNeural": "hi-IN-ArjunNeural",
  "hi-IN-KavyaNeural": "hi-IN-KavyaNeural",
  "hi-IN-KunalNeural": "hi-IN-KunalNeural",
  "hi-IN-RehaanNeural": "hi-IN-RehaanNeural",
  "hi-IN-SwaraNeural": "hi-IN-SwaraNeural",
  "hi-IN-MadhurNeural": "hi-IN-MadhurNeural",
  "it-IT-ElsaNeural": "it-IT-ElsaNeural",
  "it-IT-IsabellaNeural": "it-IT-IsabellaNeural",
  "it-IT-DiegoNeural": "it-IT-DiegoNeural",
  "it-IT-AlessioMultilingualNeural": "it-IT-AlessioMultilingualNeural",
  "it-IT-IsabellaMultilingualNeural": "it-IT-IsabellaMultilingualNeural",
  "it-IT-GiuseppeMultilingualNeural": "it-IT-GiuseppeMultilingualNeural",
  "it-IT-MarcelloMultilingualNeural": "it-IT-MarcelloMultilingualNeural",
  "it-IT-FabiolaNeural": "it-IT-FabiolaNeural",
  "it-IT-FiammaNeural": "it-IT-FiammaNeural",
  "it-IT-GiuseppeNeural": "it-IT-GiuseppeNeural",
  "it-IT-ImeldaNeural": "it-IT-ImeldaNeural",
  "it-IT-IrmaNeural": "it-IT-IrmaNeural",
  "it-IT-PalmiraNeural": "it-IT-PalmiraNeural",
  "pt-BR-FranciscaNeural": "pt-BR-FranciscaNeural",
  "pt-BR-AntonioNeural": "pt-BR-AntonioNeural",
  "pt-BR-MacerioMultilingualNeural": "pt-BR-MacerioMultilingualNeural",
  "pt-BR-ThalitaMultilingualNeural": "pt-BR-ThalitaMultilingualNeural",
  "pt-BR-BrendaNeural": "pt-BR-BrendaNeural",
  "pt-BR-DonatoNeural": "pt-BR-DonatoNeural",
  "pt-BR-ElzaNeural": "pt-BR-ElzaNeural",
  "pt-BR-FabioNeural": "pt-BR-FabioNeural",
  "pt-BR-GiovannaNeural": "pt-BR-GiovannaNeural",
  "pt-BR-HumbertoNeural": "pt-BR-HumbertoNeural",
  "pt-BR-LeilaNeural": "pt-BR-LeilaNeural",
  "pt-BR-LeticiaNeural": "pt-BR-LeticiaNeural",
  "pt-BR-ManuelaNeural": "pt-BR-ManuelaNeural",
  "pt-BR-YaraNeural": "pt-BR-YaraNeural",
  "zh-CN-XiaoxiaoNeural": "zh-CN-XiaoxiaoNeural",
  "zh-CN-YunxiNeural": "zh-CN-YunxiNeural",
  "zh-CN-YunjianNeural": "zh-CN-YunjianNeural",
  "zh-CN-XiaoyiNeural": "zh-CN-XiaoyiNeural",
  "zh-CN-YunyangNeural": "zh-CN-YunyangNeural",
  "zh-CN-XiaochenNeural": "zh-CN-XiaochenNeural",
  "zh-CN-XiaochenMultilingualNeural": "zh-CN-XiaochenMultilingualNeural",
  "zh-CN-XiaohanNeural": "zh-CN-XiaohanNeural",
  "zh-CN-XiaomengNeural": "zh-CN-XiaomengNeural",
  "zh-CN-XiaomoNeural": "zh-CN-XiaomoNeural",
  "zh-CN-XiaoqiuNeural": "zh-CN-XiaoqiuNeural",
  "zh-CN-XiaorouNeural": "zh-CN-XiaorouNeural",
  "zh-CN-XiaoruiNeural": "zh-CN-XiaoruiNeural",
  "zh-CN-XiaoxiaoMultilingualNeural": "zh-CN-XiaoxiaoMultilingualNeural",
  "zh-CN-XiaoyanNeural": "zh-CN-XiaoyanNeural",
  "ja-JP-NanamiNeural": "ja-JP-NanamiNeural",
  "ja-JP-KeitaNeural": "ja-JP-KeitaNeural",
  "ja-JP-AoiNeural": "ja-JP-AoiNeural",
  "ja-JP-DaichiNeural": "ja-JP-DaichiNeural",
  "ja-JP-MayuNeural": "ja-JP-MayuNeural",
  "ja-JP-NaokiNeural": "ja-JP-NaokiNeural",
  "ja-JP-ShioriNeural": "ja-JP-ShioriNeural",
  "uk-UA-PolinaNeural": "uk-UA-PolinaNeural",
  "uk-UA-OstapNeural": "uk-UA-OstapNeural",
  "en-AU-NatashaNeural": "en-AU-NatashaNeural",
  "en-AU-WilliamMultilingualNeural": "en-AU-WilliamMultilingualNeural",
  "en-AU-WilliamNeural": "en-AU-WilliamNeural",
  "en-AU-AnnetteNeural": "en-AU-AnnetteNeural",
  "en-AU-CarlyNeural": "en-AU-CarlyNeural",
  "en-AU-DarrenNeural": "en-AU-DarrenNeural",
  "en-AU-DuncanNeural": "en-AU-DuncanNeural",
  "en-AU-ElsieNeural": "en-AU-ElsieNeural",
  "en-AU-FreyaNeural": "en-AU-FreyaNeural",
  "en-AU-JoanneNeural": "en-AU-JoanneNeural",
  "en-AU-KenNeural": "en-AU-KenNeural",
  "en-AU-KimNeural": "en-AU-KimNeural",
  "en-AU-NeilNeural": "en-AU-NeilNeural",
  "en-AU-TimNeural": "en-AU-TimNeural",
  "en-AU-TinaNeural": "en-AU-TinaNeural",
  "xtts-v2": "xtts-v2",
  "coqui": "xtts-v2",
  // Legacy mappings
  "de": "de-DE-KatjaNeural",
  "de-male": "de-DE-ConradNeural",
  "en": "en-US-GuyNeural",
  "en-male": "en-US-GuyNeural",
  "en-us": "en-US-JennyNeural",
  "en-uk": "en-GB-SoniaNeural",
  "en-au": "en-AU-NatashaNeural",
  "fr": "fr-FR-HenriNeural",
  "ja": "ja-JP-KeitaNeural",
  "uk": "uk-UA-PolinaNeural",
  "uk-male": "uk-UA-OstapNeural",
  "uk-female": "uk-UA-PolinaNeural",
  // Backward-compatible mappings for old UI options that are not Edge voices.
  "en-US-MasonNeural": "en-US-ChristopherNeural",
  "en-US-LoganNeural": "en-US-BrianNeural",
  "en-GB-GeorgeNeural": "en-GB-ThomasNeural",
  "en-GB-MiaNeural": "en-GB-SoniaNeural",
  "en-GB-EmilyNeural": "en-GB-LibbyNeural",
  "en-GB-AlfieNeural": "en-GB-RyanNeural",
  "de-DE-LucasNeural": "de-DE-KillianNeural",
  "de-DE-LaraNeural": "de-DE-KatjaNeural",
  "de-DE-FelixNeural": "de-DE-ConradNeural",
  "de-DE-GretaNeural": "de-DE-SeraphinaMultilingualNeural",
  "de-DE-TobiasNeural": "de-DE-FlorianMultilingualNeural",
  "fr-FR-AmelieNeural": "fr-FR-EloiseNeural",
  "fr-FR-PierreNeural": "fr-FR-HenriNeural",
  "fr-FR-ClaireNeural": "fr-FR-DeniseNeural",
  "fr-FR-AntoineNeural": "fr-FR-RemyMultilingualNeural",
  "fr-FR-SophieNeural": "fr-FR-VivienneMultilingualNeural",
  "fr-FR-JulesNeural": "fr-FR-RemyMultilingualNeural",
  "es": "es-ES-ElviraNeural",
  "es-male": "es-ES-AlvaroNeural",
  "hi": "hi-IN-SwaraNeural",
  "hi-male": "hi-IN-MadhurNeural",
  "it": "it-IT-ElsaNeural",
  "it-male": "it-IT-DiegoNeural",
  "pt": "pt-BR-FranciscaNeural",
  "pt-male": "pt-BR-AntonioNeural",
  "zh": "zh-CN-XiaoxiaoNeural",
  "zh-male": "zh-CN-YunxiNeural",
  "ja-JP-AoiNeural": "ja-JP-NanamiNeural",
  "ja-JP-SousukeNeural": "ja-JP-KeitaNeural",
  "ja-JP-YuiNeural": "ja-JP-NanamiNeural",
  "ja-JP-DaichiNeural": "ja-JP-KeitaNeural",
  "ja-JP-HarunaNeural": "ja-JP-NanamiNeural",
  "ja-JP-KazuhaNeural": "ja-JP-KeitaNeural",
};

function getEdgeVoiceSet() {
  if (edgeVoiceSet) {
    return edgeVoiceSet;
  }

  const pythonExecutable = resolvePythonExecutable("edge_tts");
  if (!pythonExecutable) {
    edgeVoiceSet = new Set();
    return edgeVoiceSet;
  }

  const script = [
    "import asyncio, json, edge_tts",
    "voices = asyncio.run(edge_tts.list_voices())",
    "print(json.dumps([voice['ShortName'] for voice in voices]))",
  ].join("; ");

  const result = spawnSync(pythonExecutable, ["-c", script], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
  });

  if (result.status !== 0) {
    console.error("Failed to load Edge TTS voice list:", result.stderr || result.stdout);
    edgeVoiceSet = new Set();
    return edgeVoiceSet;
  }

  try {
    edgeVoiceSet = new Set(JSON.parse(result.stdout));
  } catch (error) {
    console.error("Failed to parse Edge TTS voice list:", error);
    edgeVoiceSet = new Set();
  }

  return edgeVoiceSet;
}

function resolveVoice(requestedVoice) {
  return voiceMap[requestedVoice] || requestedVoice;
}

function getAvailableVoices() {
  return {
    "en-US": [
      { id: "en-US-JennyNeural", name: "Jenny", type: "Female", style: "Soft" },
      { id: "en-US-GuyNeural", name: "Guy", type: "Male", style: "Bold" },
      { id: "en-US-AriaNeural", name: "Aria", type: "Female", style: "Warm" },
      { id: "en-US-EricNeural", name: "Eric", type: "Male", style: "Clear" },
      { id: "en-US-AvaNeural", name: "Ava", type: "Female", style: "Soft" },
      { id: "en-US-AvaMultilingualNeural", name: "Ava Multilingual", type: "Female", style: "Versatile" },
      { id: "en-US-AndrewNeural", name: "Andrew", type: "Male", style: "Natural" },
      { id: "en-US-AndrewMultilingualNeural", name: "Andrew Multilingual", type: "Male", style: "Versatile" },
      { id: "en-US-AmandaMultilingualNeural", name: "Amanda Multilingual", type: "Female", style: "Versatile" },
      { id: "en-US-AdamMultilingualNeural", name: "Adam Multilingual", type: "Male", style: "Versatile" },
      { id: "en-US-EmmaNeural", name: "Emma", type: "Female", style: "Public Speaker" },
      { id: "en-US-EmmaMultilingualNeural", name: "Emma Multilingual", type: "Female", style: "Versatile" },
      { id: "en-US-PhoebeMultilingualNeural", name: "Phoebe Multilingual", type: "Female", style: "Versatile" },
      { id: "en-US-BrianNeural", name: "Brian", type: "Male", style: "Warm" },
      { id: "en-US-BrianMultilingualNeural", name: "Brian Multilingual", type: "Male", style: "Versatile" },
      { id: "en-US-ChristopherNeural", name: "Christopher", type: "Male", style: "Deep" },
      { id: "en-US-MichelleNeural", name: "Michelle", type: "Female", style: "Clear" },
      { id: "en-US-RogerNeural", name: "Roger", type: "Male", style: "Warm" },
      { id: "en-US-SteffanNeural", name: "Steffan", type: "Male", style: "Clear" },
    ],
    "en-GB": [
      { id: "en-GB-SoniaNeural", name: "Sonia", type: "Female", style: "Soft" },
      { id: "en-GB-LibbyNeural", name: "Libby", type: "Female", style: "Warm" },
      { id: "en-GB-AbbiNeural", name: "Abbi", type: "Female", style: "Bright" },
      { id: "en-GB-AlfieNeural", name: "Alfie", type: "Male", style: "Clear" },
      { id: "en-GB-BellaNeural", name: "Bella", type: "Female", style: "Soft" },
      { id: "en-GB-ElliotNeural", name: "Elliot", type: "Male", style: "Warm" },
      { id: "en-GB-EthanNeural", name: "Ethan", type: "Male", style: "Clear" },
      { id: "en-GB-HollieNeural", name: "Hollie", type: "Female", style: "Bright" },
      { id: "en-GB-MaisieNeural", name: "Maisie", type: "Female", style: "Bright" },
      { id: "en-GB-NoahNeural", name: "Noah", type: "Male", style: "Natural" },
      { id: "en-GB-OliviaNeural", name: "Olivia", type: "Female", style: "Warm" },
      { id: "en-GB-PoppyNeural", name: "Poppy", type: "Female", style: "Clear" },
      { id: "en-GB-RyanNeural", name: "Ryan", type: "Male", style: "Bold" },
      { id: "en-GB-ThomasNeural", name: "Thomas", type: "Male", style: "Deep" },
      { id: "en-GB-OliverNeural", name: "Oliver", type: "Male", style: "Smooth" },
      { id: "en-GB-JamesNeural", name: "James", type: "Male", style: "Warm" },
    ],
    "de-DE": [
      { id: "de-DE-KatjaNeural", name: "Katja", type: "Female", style: "Soft" },
      { id: "de-DE-ConradNeural", name: "Conrad", type: "Male", style: "Clear" },
      { id: "de-DE-AmalaNeural", name: "Amala", type: "Female", style: "Warm" },
      { id: "de-DE-FlorianMultilingualNeural", name: "Florian", type: "Male", style: "Bold" },
      { id: "de-DE-KillianNeural", name: "Killian", type: "Male", style: "Bright" },
      { id: "de-DE-SeraphinaMultilingualNeural", name: "Seraphina", type: "Female", style: "Clear" },
    ],
    "de-AT": [
      { id: "de-AT-IngridNeural", name: "Ingrid", type: "Female", style: "Friendly" },
      { id: "de-AT-JonasNeural", name: "Jonas", type: "Male", style: "Friendly" },
    ],
    "de-CH": [
      { id: "de-CH-JanNeural", name: "Jan", type: "Male", style: "Clear" },
      { id: "de-CH-LeniNeural", name: "Leni", type: "Female", style: "Soft" },
    ],
    "fr-FR": [
      { id: "fr-FR-DeniseNeural", name: "Denise", type: "Female", style: "Soft" },
      { id: "fr-FR-HenriNeural", name: "Henri", type: "Male", style: "Clear" },
      { id: "fr-FR-EloiseNeural", name: "Eloise", type: "Female", style: "Warm" },
      { id: "fr-FR-RemyMultilingualNeural", name: "Remy", type: "Male", style: "Bold" },
      { id: "fr-FR-VivienneMultilingualNeural", name: "Vivienne", type: "Female", style: "Bright" },
      { id: "fr-FR-LucienMultilingualNeural", name: "Lucien", type: "Male", style: "Versatile" },
      { id: "fr-FR-AlainNeural", name: "Alain", type: "Male", style: "Clear" },
      { id: "fr-FR-BrigitteNeural", name: "Brigitte", type: "Female", style: "Warm" },
      { id: "fr-FR-CelesteNeural", name: "Celeste", type: "Female", style: "Soft" },
      { id: "fr-FR-ClaudeNeural", name: "Claude", type: "Male", style: "Deep" },
      { id: "fr-FR-CoralieNeural", name: "Coralie", type: "Female", style: "Bright" },
      { id: "fr-FR-JacquelineNeural", name: "Jacqueline", type: "Female", style: "Warm" },
      { id: "fr-FR-JeromeNeural", name: "Jerome", type: "Male", style: "Clear" },
      { id: "fr-FR-JosephineNeural", name: "Josephine", type: "Female", style: "Soft" },
      { id: "fr-FR-MauriceNeural", name: "Maurice", type: "Male", style: "Warm" },
      { id: "fr-FR-YvesNeural", name: "Yves", type: "Male", style: "Bold" },
      { id: "fr-FR-YvetteNeural", name: "Yvette", type: "Female", style: "Clear" },
    ],
    "es-ES": [
      { id: "es-ES-ElviraNeural", name: "Elvira", type: "Female", style: "Warm" },
      { id: "es-ES-AlvaroNeural", name: "Alvaro", type: "Male", style: "Clear" },
      { id: "es-ES-ArabellaMultilingualNeural", name: "Arabella", type: "Female", style: "Versatile" },
      { id: "es-ES-IsidoraMultilingualNeural", name: "Isidora", type: "Female", style: "Versatile" },
      { id: "es-ES-TristanMultilingualNeural", name: "Tristan", type: "Male", style: "Versatile" },
      { id: "es-ES-XimenaMultilingualNeural", name: "Ximena Multilingual", type: "Female", style: "Versatile" },
      { id: "es-ES-AbrilNeural", name: "Abril", type: "Female", style: "Bright" },
      { id: "es-ES-ArnauNeural", name: "Arnau", type: "Male", style: "Clear" },
      { id: "es-ES-DarioNeural", name: "Dario", type: "Male", style: "Warm" },
      { id: "es-ES-EstrellaNeural", name: "Estrella", type: "Female", style: "Soft" },
      { id: "es-ES-IreneNeural", name: "Irene", type: "Female", style: "Clear" },
      { id: "es-ES-LaiaNeural", name: "Laia", type: "Female", style: "Warm" },
      { id: "es-ES-LiaNeural", name: "Lia", type: "Female", style: "Bright" },
      { id: "es-ES-NilNeural", name: "Nil", type: "Male", style: "Clear" },
      { id: "es-ES-SaulNeural", name: "Saul", type: "Male", style: "Bold" },
      { id: "es-ES-TeoNeural", name: "Teo", type: "Male", style: "Natural" },
      { id: "es-ES-TrianaNeural", name: "Triana", type: "Female", style: "Warm" },
      { id: "es-ES-VeraNeural", name: "Vera", type: "Female", style: "Soft" },
      { id: "es-ES-XimenaNeural", name: "Ximena", type: "Female", style: "Clear" },
    ],
    "hi-IN": [
      { id: "hi-IN-AaravNeural", name: "Aarav", type: "Male", style: "Clear" },
      { id: "hi-IN-AnanyaNeural", name: "Ananya", type: "Female", style: "Warm" },
      { id: "hi-IN-AartiNeural", name: "Aarti", type: "Female", style: "Soft" },
      { id: "hi-IN-ArjunNeural", name: "Arjun", type: "Male", style: "Bold" },
      { id: "hi-IN-KavyaNeural", name: "Kavya", type: "Female", style: "Bright" },
      { id: "hi-IN-KunalNeural", name: "Kunal", type: "Male", style: "Deep" },
      { id: "hi-IN-RehaanNeural", name: "Rehaan", type: "Male", style: "Warm" },
      { id: "hi-IN-SwaraNeural", name: "Swara", type: "Female", style: "Warm" },
      { id: "hi-IN-MadhurNeural", name: "Madhur", type: "Male", style: "Clear" },
    ],
    "it-IT": [
      { id: "it-IT-ElsaNeural", name: "Elsa", type: "Female", style: "Soft" },
      { id: "it-IT-IsabellaNeural", name: "Isabella", type: "Female", style: "Warm" },
      { id: "it-IT-DiegoNeural", name: "Diego", type: "Male", style: "Clear" },
      { id: "it-IT-AlessioMultilingualNeural", name: "Alessio", type: "Male", style: "Versatile" },
      { id: "it-IT-IsabellaMultilingualNeural", name: "Isabella Multilingual", type: "Female", style: "Versatile" },
      { id: "it-IT-GiuseppeMultilingualNeural", name: "Giuseppe Multilingual", type: "Male", style: "Versatile" },
      { id: "it-IT-MarcelloMultilingualNeural", name: "Marcello", type: "Male", style: "Versatile" },
      { id: "it-IT-FabiolaNeural", name: "Fabiola", type: "Female", style: "Bright" },
      { id: "it-IT-FiammaNeural", name: "Fiamma", type: "Female", style: "Warm" },
      { id: "it-IT-GiuseppeNeural", name: "Giuseppe", type: "Male", style: "Clear" },
      { id: "it-IT-ImeldaNeural", name: "Imelda", type: "Female", style: "Soft" },
      { id: "it-IT-IrmaNeural", name: "Irma", type: "Female", style: "Clear" },
      { id: "it-IT-PalmiraNeural", name: "Palmira", type: "Female", style: "Warm" },
    ],
    "pt-BR": [
      { id: "pt-BR-FranciscaNeural", name: "Francisca", type: "Female", style: "Warm" },
      { id: "pt-BR-AntonioNeural", name: "Antonio", type: "Male", style: "Clear" },
      { id: "pt-BR-MacerioMultilingualNeural", name: "Macerio", type: "Male", style: "Versatile" },
      { id: "pt-BR-ThalitaMultilingualNeural", name: "Thalita Multilingual", type: "Female", style: "Versatile" },
      { id: "pt-BR-BrendaNeural", name: "Brenda", type: "Female", style: "Bright" },
      { id: "pt-BR-DonatoNeural", name: "Donato", type: "Male", style: "Deep" },
      { id: "pt-BR-ElzaNeural", name: "Elza", type: "Female", style: "Soft" },
      { id: "pt-BR-FabioNeural", name: "Fabio", type: "Male", style: "Clear" },
      { id: "pt-BR-GiovannaNeural", name: "Giovanna", type: "Female", style: "Warm" },
      { id: "pt-BR-HumbertoNeural", name: "Humberto", type: "Male", style: "Bold" },
      { id: "pt-BR-LeilaNeural", name: "Leila", type: "Female", style: "Clear" },
      { id: "pt-BR-LeticiaNeural", name: "Leticia", type: "Female", style: "Soft" },
      { id: "pt-BR-ManuelaNeural", name: "Manuela", type: "Female", style: "Warm" },
      { id: "pt-BR-YaraNeural", name: "Yara", type: "Female", style: "Bright" },
    ],
    "zh-CN": [
      { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao", type: "Female", style: "Soft" },
      { id: "zh-CN-YunxiNeural", name: "Yunxi", type: "Male", style: "Clear" },
      { id: "zh-CN-YunjianNeural", name: "Yunjian", type: "Male", style: "Deep" },
      { id: "zh-CN-XiaoyiNeural", name: "Xiaoyi", type: "Female", style: "Bright" },
      { id: "zh-CN-YunyangNeural", name: "Yunyang", type: "Male", style: "Professional" },
      { id: "zh-CN-XiaochenNeural", name: "Xiaochen", type: "Female", style: "Warm" },
      { id: "zh-CN-XiaochenMultilingualNeural", name: "Xiaochen Multilingual", type: "Female", style: "Versatile" },
      { id: "zh-CN-XiaohanNeural", name: "Xiaohan", type: "Female", style: "Clear" },
      { id: "zh-CN-XiaomengNeural", name: "Xiaomeng", type: "Female", style: "Soft" },
      { id: "zh-CN-XiaomoNeural", name: "Xiaomo", type: "Female", style: "Warm" },
      { id: "zh-CN-XiaoqiuNeural", name: "Xiaoqiu", type: "Female", style: "Clear" },
      { id: "zh-CN-XiaorouNeural", name: "Xiaorou", type: "Female", style: "Soft" },
      { id: "zh-CN-XiaoruiNeural", name: "Xiaorui", type: "Female", style: "Serious" },
      { id: "zh-CN-XiaoxiaoMultilingualNeural", name: "Xiaoxiao Multilingual", type: "Female", style: "Versatile" },
      { id: "zh-CN-XiaoyanNeural", name: "Xiaoyan", type: "Female", style: "Warm" },
    ],
    "ja-JP": [
      { id: "ja-JP-NanamiNeural", name: "Nanami", type: "Female", style: "Soft" },
      { id: "ja-JP-KeitaNeural", name: "Keita", type: "Male", style: "Clear" },
      { id: "ja-JP-AoiNeural", name: "Aoi", type: "Female", style: "Bright" },
      { id: "ja-JP-DaichiNeural", name: "Daichi", type: "Male", style: "Deep" },
      { id: "ja-JP-MayuNeural", name: "Mayu", type: "Female", style: "Warm" },
      { id: "ja-JP-NaokiNeural", name: "Naoki", type: "Male", style: "Natural" },
      { id: "ja-JP-ShioriNeural", name: "Shiori", type: "Female", style: "Clear" },
    ],
    "uk-UA": [
      { id: "uk-UA-PolinaNeural", name: "Polina", type: "Female", style: "Soft" },
      { id: "uk-UA-OstapNeural", name: "Ostap", type: "Male", style: "Clear" },
    ],
    "en-AU": [
      { id: "en-AU-NatashaNeural", name: "Natasha", type: "Female", style: "Soft" },
      { id: "en-AU-WilliamMultilingualNeural", name: "William", type: "Male", style: "Clear" },
      { id: "en-AU-WilliamNeural", name: "William Standard", type: "Male", style: "Natural" },
      { id: "en-AU-AnnetteNeural", name: "Annette", type: "Female", style: "Warm" },
      { id: "en-AU-CarlyNeural", name: "Carly", type: "Female", style: "Bright" },
      { id: "en-AU-DarrenNeural", name: "Darren", type: "Male", style: "Clear" },
      { id: "en-AU-DuncanNeural", name: "Duncan", type: "Male", style: "Warm" },
      { id: "en-AU-ElsieNeural", name: "Elsie", type: "Female", style: "Soft" },
      { id: "en-AU-FreyaNeural", name: "Freya", type: "Female", style: "Bright" },
      { id: "en-AU-JoanneNeural", name: "Joanne", type: "Female", style: "Clear" },
      { id: "en-AU-KenNeural", name: "Ken", type: "Male", style: "Deep" },
      { id: "en-AU-KimNeural", name: "Kim", type: "Female", style: "Warm" },
      { id: "en-AU-NeilNeural", name: "Neil", type: "Male", style: "Clear" },
      { id: "en-AU-TimNeural", name: "Tim", type: "Male", style: "Bold" },
      { id: "en-AU-TinaNeural", name: "Tina", type: "Female", style: "Soft" },
    ],
    "XTTS-v2": [
      { id: "xtts-v2", name: "XTTS v2", type: "Multilingual", style: "Coqui" },
    ],
  };
}

function getVoiceMeta(voiceId) {
  const voices = getAvailableVoices();
  for (const voiceGroup of Object.values(voices)) {
    const match = voiceGroup.find((voice) => voice.id === voiceId);
    if (match) {
      return {
        ...match,
        language: voiceId.split('-').slice(0, 2).join('-'),
      };
    }
  }
  return {
    id: voiceId,
    name: voiceId,
    type: 'Unknown',
    style: 'Unknown',
    language: voiceId.split('-').slice(0, 2).join('-'),
  };
}

function isSupportedVoice(requestedVoice, requestedEngine) {
  if (!requestedVoice) {
    return true;
  }

  if (requestedEngine === "coqui" || requestedVoice === "xtts-v2" || requestedVoice === "coqui") {
    return true;
  }

  const resolvedVoice = resolveVoice(requestedVoice);
  return Boolean(voiceMap[requestedVoice]) || getEdgeVoiceSet().has(resolvedVoice);
}

const configuredAllowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions = configuredAllowedOrigins.length > 0
  ? {
      origin(origin, callback) {
        if (!origin || configuredAllowedOrigins.includes(origin.replace(/\/+$/, ''))) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }
  : {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

if (isProduction && configuredAllowedOrigins.length === 0) {
  console.warn('CORS: no FRONTEND_URL or CORS_ORIGINS configured in production; allowing browser requests from any origin.');
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "64kb" }));

function normalizeUser(user) {
  return {
    ...user,
    role: user.role || "user",
    accessStatus: user.accessStatus || "approved",
    sessions: Array.isArray(user.sessions) ? user.sessions : [],
  };
}

function publicUser(user) {
  const { password, passwordHash, passwordSalt, sessions, ...safeUser } = normalizeUser(user);
  return safeUser;
}

function loadUsers() {
  if (cachedUsers !== null) {
    return cachedUsers;
  }

  let fileUsers = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      fileUsers = Array.isArray(parsed) ? parsed.map(normalizeUser) : [];
    }
  } catch (error) {
    console.error("Failed to load users from file:", error);
  }
  cachedUsers = fileUsers;
  return cachedUsers;
}

function saveUsers(users) {
  cachedUsers = users.map(normalizeUser);
  
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(cachedUsers, null, 2));
  } catch (error) {
    console.error("Failed to save users locally:", error);
  }

  if (db) {
    db.collection("users").deleteMany({})
      .then(() => {
        if (cachedUsers.length > 0) {
          return db.collection("users").insertMany(cachedUsers);
        }
      })
      .then(() => {
        console.log(`Successfully backed up ${cachedUsers.length} users to MongoDB in background.`);
      })
      .catch(err => {
        console.error("Failed to sync users to MongoDB:", err);
      });
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { passwordSalt: salt, passwordHash };
}

function ensureDefaultAdminUser() {
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "sksaran987@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Sarankd@987";

  if (!adminEmail || !adminPassword) {
    if (!isProduction) {
      console.warn("Default admin user was not created. Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD to enable bootstrap admin creation.");
    }
    return;
  }

  const users = loadUsers();
  const existingAdmin = users.find((user) => user.email === adminEmail);

  if (existingAdmin) {
    const { passwordHash, passwordSalt } = hashPassword(adminPassword);
    const updatedAdmin = normalizeUser({
      ...existingAdmin,
      role: "admin",
      accessStatus: "approved",
      passwordHash,
      passwordSalt,
      profile: {
        displayName: existingAdmin.profile?.displayName || existingAdmin.name || "Admin",
        email: adminEmail,
        avatarUrl: existingAdmin.profile?.avatarUrl || "",
      },
    });
    saveUsers(users.map((user) => (user.id === existingAdmin.id ? updatedAdmin : user)));
    return;
  }

  const hasAnyAdmin = users.some((user) => user.role === "admin");
  if (hasAnyAdmin) {
    return;
  }

  const adminUser = createUser({
    name: "Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    accessStatus: "approved",
  });

  saveUsers([...users, adminUser]);
}

function verifyPassword(password, user) {
  if (user.passwordHash && user.passwordSalt) {
    const { passwordHash } = hashPassword(password, user.passwordSalt);
    const expected = Buffer.from(user.passwordHash, "hex");
    const actual = Buffer.from(passwordHash, "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
  }

  return user.password === password;
}

function createUser({ name, email, password, role = "user", accessStatus = "pending" }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { passwordHash, passwordSalt } = hashPassword(password);

  return normalizeUser({
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    passwordSalt,
    role,
    accessStatus,
    joined: new Date().toISOString(),
    profile: {
      displayName: name.trim(),
      email: normalizedEmail,
    },
    sessions: [],
  });
}

function issueSession(user) {
  return {
    token: crypto.randomBytes(32).toString("hex"),
    createdAt: new Date().toISOString(),
  };
}

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function findUserByToken(token) {
  if (!token) return null;
  const now = Date.now();
  const sessionTtlMs = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  return loadUsers().find((user) => user.sessions.some((session) => {
    if (session.token !== token) return false;
    const createdAt = new Date(session.createdAt).getTime();
    return !Number.isNaN(createdAt) && now - createdAt <= sessionTtlMs;
  })) || null;
}

function requireAuth(req, res, next) {
  const user = findUserByToken(readBearerToken(req));
  if (!user || user.accessStatus !== "approved") {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Login is required",
    });
    return;
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Admin access is required",
      });
      return;
    }

    next();
  });
}

function validateAccountFields({ name, email, password }, { requirePassword = true } = {}) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return "Name is required.";
  }
  if (!email || typeof email !== "string" || !email.trim().includes("@")) {
    return "A valid email is required.";
  }
  if (requirePassword && (!password || typeof password !== "string" || password.length < 8)) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Request validation middleware
const validateTTSRequest = (req, res, next) => {
  const { text, voice, engine, language } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      error: "INVALID_TEXT",
      message: "Text is required and must be a string",
    });
  }

  if (text.trim().length === 0) {
    return res.status(400).json({
      error: "EMPTY_TEXT",
      message: "Text cannot be empty",
    });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: "TEXT_TOO_LONG",
      message: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
    });
  }

  if (voice && !isSupportedVoice(voice, engine)) {
    return res.status(400).json({
      error: "INVALID_VOICE",
      message: `Invalid voice selected: ${voice}`,
    });
  }

  if (engine && !['edge-tts', 'coqui'].includes(engine)) {
    return res.status(400).json({
      error: "INVALID_ENGINE",
      message: "Invalid TTS engine selected",
    });
  }

  if (language && typeof language !== 'string') {
    return res.status(400).json({
      error: "INVALID_LANGUAGE",
      message: "Language must be a string",
    });
  }

  next();
};

const resolveEngine = (requestedVoice, requestedEngine) => {
  if (requestedEngine === 'coqui' || requestedVoice === 'xtts-v2' || requestedVoice === 'coqui') {
    return 'coqui';
  }
  return 'edge-tts';
};

// Generate cache key from text and voice
const generateCacheKey = (text, voice, engine = 'edge-tts', language = 'en') => {
  const hash = crypto.createHash("md5").update(`${text}|${voice}|${engine}|${language}`).digest("hex");
  return path.join(CACHE_DIR, `${hash}.mp3`);
};

function cleanupTempFile(filePath) {
  fs.unlink(filePath, () => {});
}

// Generate audio function
function generateAudio(text, voice, cacheKey, options = {}) {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (fs.existsSync(cacheKey)) {
      return resolve({ filePath: cacheKey, fromCache: true });
    }

    const fileName = `audio-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
    const tempFilePath = path.join(__dirname, fileName);
    const engine = resolveEngine(voice, options.engine);
    const language = options.language || 'en';
    const script = engine === 'coqui' ? xttsScript : edgeTtsScript;
    const requiredPythonModule = engine === 'coqui' ? 'TTS' : 'edge_tts';
    const pythonExecutable = resolvePythonExecutable(requiredPythonModule);

    if (!pythonExecutable) {
      reject(new Error(
        "The hosted voice service is not ready yet. Please try again shortly or contact the site owner."
      ));
      return;
    }

    const args = engine === 'coqui'
      ? [script, "--text", text, "--language", language, "--voice", voice, "--output", tempFilePath]
      : [script, "--text", text, "--voice", voice, "--output", tempFilePath];

    const child = spawn(pythonExecutable, args, {
      windowsHide: true,
    });

    let stderr = "";
    let stdout = "";
    let settled = false;
    let timeout = setTimeout(() => {
      settled = true;
      child.kill();
      cleanupTempFile(tempFilePath);
      reject(new Error("Audio generation timed out. Try shorter text or try again."));
    }, REQUEST_TIMEOUT);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanupTempFile(tempFilePath);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        cleanupTempFile(tempFilePath);
        reject(new Error((stderr || stdout || `${engine === 'coqui' ? 'XTTS' : 'Edge TTS'} failed with exit code ${code}`).trim()));
        return;
      }

      if (!fs.existsSync(tempFilePath) || fs.statSync(tempFilePath).size === 0) {
        cleanupTempFile(tempFilePath);
        reject(new Error("Audio generation finished, but no audio file was created."));
        return;
      }

      // Move to cache
      fs.rename(tempFilePath, cacheKey, (err) => {
        if (err) {
          // If rename fails, just use temp file
          resolve({ filePath: tempFilePath, fromCache: false });
        } else {
          resolve({ filePath: cacheKey, fromCache: false });
        }
      });
    });
  });
}

// Load or initialize history
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Failed to load history:", error);
  }
  return [];
}

// Save history
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Add to history
function addToHistory(text, voice, status = 'success') {
  const voiceMeta = getVoiceMeta(voice);
  const history = loadHistory();
  history.unshift({
    id: Date.now(),
    text: text.substring(0, 100),
    voice,
    language: voiceMeta.language,
    gender: voiceMeta.type,
    status,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 100 entries
  if (history.length > 100) {
    history.pop();
  }
  saveHistory(history);
}

// Routes

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    service: "text-to-audio-backend",
    uptime: process.uptime(),
    python: {
      executable: defaultPythonExecutable || null,
      edgeTtsAvailable: Boolean(resolvePythonExecutable("edge_tts")),
    },
  });
});

app.post("/api/auth/register", (req, res) => {
  const validationError = validateAccountFields(req.body);
  if (validationError) {
    res.status(400).json({ error: "INVALID_ACCOUNT", message: validationError });
    return;
  }

  const users = loadUsers();
  const normalizedEmail = req.body.email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    res.status(409).json({ error: "EMAIL_EXISTS", message: "This email is already registered." });
    return;
  }

  const newUser = createUser({
    name: req.body.name,
    email: normalizedEmail,
    password: req.body.password,
    role: "user",
    accessStatus: REQUIRE_ADMIN_APPROVAL ? "pending" : "approved",
  });

  let token = null;
  if (newUser.accessStatus === "approved") {
    const session = issueSession(newUser);
    newUser.sessions.push(session);
    token = session.token;
  }

  saveUsers([...users, newUser]);
  res.status(201).json({ user: publicUser(newUser), token });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const users = loadUsers();
  const user = users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user)) {
    res.status(401).json({ error: "INVALID_LOGIN", message: "Invalid email or password." });
    return;
  }

  if (user.accessStatus !== "approved") {
    res.status(403).json({ error: "ACCESS_PENDING", message: "Your account is waiting for admin access." });
    return;
  }

  const session = issueSession(user);
  const updatedUser = { ...user, sessions: [...user.sessions, session] };
  saveUsers(users.map((item) => (item.id === updatedUser.id ? updatedUser : item)));

  res.json({ user: publicUser(updatedUser), token: session.token });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = readBearerToken(req);
  const users = loadUsers().map((user) => (
    user.id === req.user.id
      ? { ...user, sessions: user.sessions.filter((session) => session.token !== token) }
      : user
  ));
  saveUsers(users);
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.put("/api/auth/profile", requireAuth, (req, res) => {
  const validationError = validateAccountFields({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  }, { requirePassword: false });

  if (validationError) {
    res.status(400).json({ error: "INVALID_PROFILE", message: validationError });
    return;
  }

  const normalizedEmail = req.body.email.trim().toLowerCase();
  const users = loadUsers();
  const emailTaken = users.some((user) => user.email === normalizedEmail && user.id !== req.user.id);
  if (emailTaken) {
    res.status(409).json({ error: "EMAIL_EXISTS", message: "That email is already in use." });
    return;
  }

  const updatedUsers = users.map((user) => {
    if (user.id !== req.user.id) return user;

    const passwordFields = req.body.password ? hashPassword(req.body.password) : {};
    return normalizeUser({
      ...user,
      ...passwordFields,
      name: req.body.name.trim(),
      email: normalizedEmail,
      profile: {
        displayName: req.body.name.trim(),
        email: normalizedEmail,
        avatarUrl: req.body.avatarUrl || (user.profile && user.profile.avatarUrl) || "",
      },
    });
  });

  saveUsers(updatedUsers);
  res.json({ user: publicUser(updatedUsers.find((user) => user.id === req.user.id)) });
});

app.delete("/api/auth/account", requireAuth, (req, res) => {
  const users = loadUsers().filter((user) => user.id !== req.user.id);
  saveUsers(users);
  res.json({ message: "Account deleted" });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json({ users: loadUsers().map(publicUser) });
});

app.post("/api/admin/users", requireAdmin, (req, res) => {
  const validationError = validateAccountFields(req.body);
  if (validationError) {
    res.status(400).json({ error: "INVALID_ACCOUNT", message: validationError });
    return;
  }

  const users = loadUsers();
  const normalizedEmail = req.body.email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    res.status(409).json({ error: "EMAIL_EXISTS", message: "This email is already registered." });
    return;
  }

  const role = req.body.role === "admin" ? "admin" : "user";
  const newUser = createUser({
    name: req.body.name,
    email: normalizedEmail,
    password: req.body.password,
    role,
    accessStatus: "approved",
  });

  saveUsers([...users, newUser]);
  res.status(201).json({ user: publicUser(newUser), users: [...users, newUser].map(publicUser) });
});

app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const userId = String(req.params.id);
  const users = loadUsers();
  const target = users.find((user) => String(user.id) === userId);

  if (!target) {
    res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found." });
    return;
  }

  const accessStatus = ["approved", "pending"].includes(req.body.accessStatus) ? req.body.accessStatus : target.accessStatus;
  const role = ["admin", "user"].includes(req.body.role) ? req.body.role : target.role;

  const updatedUsers = users.map((user) => (
    String(user.id) === userId ? { ...user, accessStatus, role } : user
  ));

  saveUsers(updatedUsers);
  res.json({ users: updatedUsers.map(publicUser) });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const userId = String(req.params.id);
  if (String(req.user.id) === userId) {
    res.status(400).json({ error: "SELF_DELETE", message: "You cannot delete your own admin account." });
    return;
  }

  const users = loadUsers();
  const updatedUsers = users.filter((user) => String(user.id) !== userId);
  if (updatedUsers.length === users.length) {
    res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found." });
    return;
  }

  saveUsers(updatedUsers);
  res.json({ users: updatedUsers.map(publicUser) });
});

// Legacy endpoint - kept for backward compatibility
app.post("/convert", validateTTSRequest, asyncHandler(async (req, res) => {
  const text = req.body.text.trim();
  const requestedVoice = req.body.voice || "en-US-JennyNeural";
  const voice = resolveVoice(requestedVoice);
  const engine = resolveEngine(requestedVoice, req.body.engine);

  try {
    const cacheKey = generateCacheKey(text, voice, engine, req.body.language || 'en');
    const { filePath } = await generateAudio(text, voice, cacheKey, { engine, language: req.body.language });

    addToHistory(text, voice);

    res.download(filePath, "audio.mp3", (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        console.error("Error sending audio file:", downloadErr);
      }
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    res.status(500).json({
      error: "GENERATION_FAILED",
      message: error.message || "Failed to generate audio",
    });
  }
}));

// New API endpoints

// Generate TTS audio
app.post("/api/tts/generate", validateTTSRequest, asyncHandler(async (req, res) => {
  const text = req.body.text.trim();
  const requestedVoice = req.body.voice || "en-US-JennyNeural";
  const selectedVoice = resolveVoice(requestedVoice);
  const engine = resolveEngine(requestedVoice, req.body.engine);

  try {
    const cacheKey = generateCacheKey(text, selectedVoice, engine, req.body.language || 'en');
    const { filePath, fromCache } = await generateAudio(text, selectedVoice, cacheKey, { engine, language: req.body.language });

    addToHistory(text, selectedVoice, 'success');

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-From-Cache", fromCache ? "true" : "false");
    res.setHeader("X-Voice", selectedVoice);
    res.setHeader("X-Engine", engine);
    res.download(filePath, "audio.mp3", (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        console.error("Error sending audio file:", downloadErr);
      }
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    addToHistory(text, requestedVoice, 'failure');
    res.status(500).json({
      error: "GENERATION_FAILED",
      message: error.message || "Failed to generate audio",
    });
  }
}));

app.post("/api/tts/multi-speaker", requireAuth, asyncHandler(async (req, res) => {
  const { text, voiceMapping } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Conversation text is required." });
    return;
  }
  if (!voiceMapping || typeof voiceMapping !== "object") {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Voice mapping is required." });
    return;
  }

  const lines = text.split("\n");
  const turns = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const match = line.match(/^([a-zA-Z0-9\s_-]+):(.*)$/);
    if (match) {
      const speaker = match[1].trim();
      const speech = match[2].trim();
      const voice = voiceMapping[speaker] || "en-US-JennyNeural";
      turns.push({ speaker, text: speech, voice });
    } else {
      if (turns.length > 0) {
        turns[turns.length - 1].text += " " + line;
      } else {
        const voice = voiceMapping["Narrator"] || Object.values(voiceMapping)[0] || "en-US-JennyNeural";
        turns.push({ speaker: "Narrator", text: line, voice });
      }
    }
  }

  if (turns.length === 0) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "No conversation turns detected." });
    return;
  }

  try {
    const buffers = [];

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const selectedVoice = resolveVoice(turn.voice);
      const engine = resolveEngine(selectedVoice);
      
      // Clean/transliterate German umlauts for non-German voices to prevent Microsoft socket crashes
      let ttsText = turn.text;
      if (!selectedVoice.startsWith("de-")) {
        ttsText = ttsText
          .replace(/ä/g, 'ae')
          .replace(/ö/g, 'oe')
          .replace(/ü/g, 'ue')
          .replace(/ß/g, 'ss')
          .replace(/Ä/g, 'Ae')
          .replace(/Ö/g, 'Oe')
          .replace(/Ü/g, 'Ue');
      }

      const cacheKey = generateCacheKey(ttsText, selectedVoice, engine, "en");
      
      if (i > 0) {
        // Sleep for 500ms to prevent rate limiting Edge TTS connections
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      const { filePath } = await generateAudio(ttsText, selectedVoice, cacheKey, { engine });
      
      const buffer = fs.readFileSync(filePath);
      buffers.push(buffer);
    }

    const mergedBuffer = Buffer.concat(buffers);
    const mergedFileName = `multi-speaker-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
    const mergedFilePath = path.join(CACHE_DIR, mergedFileName);
    fs.writeFileSync(mergedFilePath, mergedBuffer);

    addToHistory(`Multi-Speaker Conversation (${turns.length} turns)`, "Multi-Speaker", "success");

    res.setHeader("Content-Type", "audio/mpeg");
    res.download(mergedFilePath, "merged_conversation.mp3", (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        console.error("Error sending merged audio:", downloadErr);
      }
    });
  } catch (error) {
    console.error("Multi-speaker generation failed:", error);
    addToHistory("Multi-Speaker Conversation (Failed)", "Multi-Speaker", "failure");
    res.status(500).json({
      error: "GENERATION_FAILED",
      message: error.message || "Failed to generate multi-speaker audio",
    });
  }
}));

// Get generation history
app.get("/api/tts/history", (req, res) => {
  try {
    const history = loadHistory();
    res.json({ data: history, count: history.length });
  } catch (error) {
    res.status(500).json({
      error: "HISTORY_LOAD_FAILED",
      message: error.message,
    });
  }
});

// Clear generation history permanently
app.delete("/api/tts/history", (req, res) => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
    res.json({ message: "Generation history cleared", data: [] });
  } catch (error) {
    res.status(500).json({
      error: "HISTORY_CLEAR_FAILED",
      message: error.message,
    });
  }
});

// Get available voices
app.get("/api/tts/voices", (req, res) => {
  const voices = getAvailableVoices();

  res.json({ data: voices });
});
// Clear cache
app.post("/api/cache/clear", asyncHandler(async (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      if (path.extname(filePath) === ".mp3" && fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    res.json({ message: "Cache cleared", deletedCount });
  } catch (error) {
    res.status(500).json({
      error: "CACHE_CLEAR_FAILED",
      message: error.message,
    });
  }
}));

// Get server stats
app.get("/api/stats", (req, res) => {
  try {
    const cacheFiles = fs.readdirSync(CACHE_DIR);
    const history = loadHistory();

    let cacheSize = 0;
    for (const file of cacheFiles) {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      cacheSize += stats.size;
    }

    const successCount = history.filter((item) => item.status !== 'failure').length;
    const failureCount = history.filter((item) => item.status === 'failure').length;
    const genderCounts = history.reduce(
      (counts, item) => {
        const type = String(item.gender || 'Unknown').toLowerCase();
        if (type === 'male') counts.male += 1;
        else if (type === 'female') counts.female += 1;
        else counts.other += 1;
        return counts;
      },
      { male: 0, female: 0, other: 0 }
    );

    const languageCounts = history.reduce((counts, item) => {
      const language = String(item.language || item.voice || '').split('-').slice(0, 2).join('-') || 'unknown';
      counts[language] = (counts[language] || 0) + 1;
      return counts;
    }, {});

    res.json({
      cacheSize: Math.round(cacheSize / 1024 / 1024 * 100) / 100 + " MB",
      cacheFiles: cacheFiles.length,
      historyEntries: history.length,
      successCount,
      failureCount,
      genderCounts,
      languageCounts,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      error: "STATS_FAILED",
      message: error.message,
    });
  }
});

if (fs.existsSync(frontendBuildDir)) {
  app.use(express.static(frontendBuildDir));

  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/health" || req.path === "/convert") {
      next();
      return;
    }

    res.sendFile(path.join(frontendBuildDir, "index.html"));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: process.env.NODE_ENV === "production" ? "An error occurred" : err.message,
  });
});

let db = null;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  console.log("Attempting to connect to MongoDB Atlas...");
  MongoClient.connect(MONGODB_URI)
    .then(client => {
      db = client.db();
      console.log("Connected to MongoDB successfully!");
      return db.collection("users").find({}).toArray();
    })
    .then(dbUsers => {
      if (dbUsers && dbUsers.length > 0) {
        cachedUsers = dbUsers.map(({ _id, ...user }) => normalizeUser(user));
        console.log(`Loaded ${cachedUsers.length} users from MongoDB into memory cache.`);
      } else {
        console.log("MongoDB users collection is empty. Backing up local users to MongoDB...");
        const currentUsers = loadUsers();
        if (currentUsers.length > 0) {
          return db.collection("users").insertMany(currentUsers);
        }
      }
    })
    .then(() => {
      ensureDefaultAdminUser();
    })
    .catch(err => {
      console.error("MongoDB initialization failed:", err);
      ensureDefaultAdminUser();
    });
} else {
  ensureDefaultAdminUser();
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎵 Server running on port ${PORT}`);
  console.log(`Cache directory: ${CACHE_DIR}`);
  console.log(`History file: ${HISTORY_FILE}`);
  console.log(`Python executable: ${defaultPythonExecutable || "not found"}`);
});
