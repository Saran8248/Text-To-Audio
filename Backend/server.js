const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const cors = require("cors");

const app = express();
const edgeTtsScript = path.join(__dirname, "edge_tts_generator.py");
const xttsScript = path.join(__dirname, "xtts_generator.py");

function getPythonCandidates() {
  const candidates = [
    process.env.PYTHON_EXECUTABLE,
    path.join(__dirname, ".venv", "Scripts", "python.exe"),
    path.join(__dirname, "..", ".venv", "Scripts", "python.exe"),
    path.join(__dirname, "..", ".venv-1", "Scripts", "python.exe"),
    "C:\\Program Files\\Python310\\python.exe",
    "C:\\Users\\sksar\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
    "python",
  ].filter(Boolean);

  return [...new Set(candidates)].filter((candidate) => (
    candidate === "python" || fs.existsSync(candidate)
  ));
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
  "en-US-EmmaNeural": "en-US-EmmaNeural",
  "en-US-BrianNeural": "en-US-BrianNeural",
  "en-US-ChristopherNeural": "en-US-ChristopherNeural",
  "en-GB-SoniaNeural": "en-GB-SoniaNeural",
  "en-GB-RyanNeural": "en-GB-RyanNeural",
  "en-GB-LibbyNeural": "en-GB-LibbyNeural",
  "en-GB-MaisieNeural": "en-GB-MaisieNeural",
  "en-GB-PoppyNeural": "en-GB-PoppyNeural",
  "en-GB-ThomasNeural": "en-GB-ThomasNeural",
  "en-GB-OliverNeural": "en-GB-OliverNeural",
  "en-GB-JamesNeural": "en-GB-JamesNeural",
  "de-DE-KatjaNeural": "de-DE-KatjaNeural",
  "de-DE-ConradNeural": "de-DE-ConradNeural",
  "de-DE-AmalaNeural": "de-DE-AmalaNeural",
  "de-DE-FlorianMultilingualNeural": "de-DE-FlorianMultilingualNeural",
  "de-DE-KillianNeural": "de-DE-KillianNeural",
  "de-DE-SeraphinaMultilingualNeural": "de-DE-SeraphinaMultilingualNeural",
  "fr-FR-DeniseNeural": "fr-FR-DeniseNeural",
  "fr-FR-HenriNeural": "fr-FR-HenriNeural",
  "fr-FR-EloiseNeural": "fr-FR-EloiseNeural",
  "fr-FR-RemyMultilingualNeural": "fr-FR-RemyMultilingualNeural",
  "fr-FR-VivienneMultilingualNeural": "fr-FR-VivienneMultilingualNeural",
  "ja-JP-NanamiNeural": "ja-JP-NanamiNeural",
  "ja-JP-KeitaNeural": "ja-JP-KeitaNeural",
  "uk-UA-PolinaNeural": "uk-UA-PolinaNeural",
  "uk-UA-OstapNeural": "uk-UA-OstapNeural",
  "en-AU-NatashaNeural": "en-AU-NatashaNeural",
  "en-AU-WilliamMultilingualNeural": "en-AU-WilliamMultilingualNeural",
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
      { id: "en-US-EmmaNeural", name: "Emma", type: "Female", style: "Public Speaker" },
      { id: "en-US-BrianNeural", name: "Brian", type: "Male", style: "Warm" },
      { id: "en-US-ChristopherNeural", name: "Christopher", type: "Male", style: "Deep" },
    ],
    "en-GB": [
      { id: "en-GB-SoniaNeural", name: "Sonia", type: "Female", style: "Soft" },
      { id: "en-GB-LibbyNeural", name: "Libby", type: "Female", style: "Warm" },
      { id: "en-GB-MaisieNeural", name: "Maisie", type: "Female", style: "Bright" },
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
    "fr-FR": [
      { id: "fr-FR-DeniseNeural", name: "Denise", type: "Female", style: "Soft" },
      { id: "fr-FR-HenriNeural", name: "Henri", type: "Male", style: "Clear" },
      { id: "fr-FR-EloiseNeural", name: "Eloise", type: "Female", style: "Warm" },
      { id: "fr-FR-RemyMultilingualNeural", name: "Remy", type: "Male", style: "Bold" },
      { id: "fr-FR-VivienneMultilingualNeural", name: "Vivienne", type: "Female", style: "Bright" },
    ],
    "ja-JP": [
      { id: "ja-JP-NanamiNeural", name: "Nanami", type: "Female", style: "Soft" },
      { id: "ja-JP-KeitaNeural", name: "Keita", type: "Male", style: "Clear" },
    ],
    "uk-UA": [
      { id: "uk-UA-PolinaNeural", name: "Polina", type: "Female", style: "Soft" },
      { id: "uk-UA-OstapNeural", name: "Ostap", type: "Male", style: "Clear" },
    ],
    "en-AU": [
      { id: "en-AU-NatashaNeural", name: "Natasha", type: "Female", style: "Soft" },
      { id: "en-AU-WilliamMultilingualNeural", name: "William", type: "Male", style: "Clear" },
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
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://localhost:3000',
  'https://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://127.0.0.1:3000',
  'https://127.0.0.1:5000',
  'http://[::1]:3000',
  'http://[::1]:5000',
];
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins])];
const allowAllOrigins = process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0;

if (process.env.NODE_ENV === 'production' && allowAllOrigins) {
  console.warn('CORS: no FRONTEND_URL or CORS_ORIGINS configured; allowing all origins in production.');
}

// Middleware
app.use(cors({
  origin: allowAllOrigins
    ? true
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked origin: ${origin}`));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());

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
  try {
    if (fs.existsSync(USERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      return Array.isArray(parsed) ? parsed.map(normalizeUser) : [];
    }
  } catch (error) {
    console.error("Failed to load users:", error);
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users.map(normalizeUser), null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { passwordSalt: salt, passwordHash };
}

function verifyPassword(password, user) {
  if (user.passwordHash && user.passwordSalt) {
    const { passwordHash } = hashPassword(password, user.passwordSalt);
    return crypto.timingSafeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(user.passwordHash, "hex"));
  }

  return user.password === password;
}

function createUser({ name, email, password, role = "user", accessStatus = "pending" }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { passwordHash, passwordSalt } = hashPassword(password);

  return normalizeUser({
    id: Date.now() + Math.floor(Math.random() * 1000),
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
  return loadUsers().find((user) => user.sessions.some((session) => session.token === token)) || null;
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
  if (requirePassword && (!password || typeof password !== "string" || password.length < 6)) {
    return "Password must be at least 6 characters.";
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
        `${engine === 'coqui' ? 'Coqui TTS' : 'Edge TTS'} is not installed in a compatible Python environment. ` +
        `Install ${requiredPythonModule} with Python 3.10-3.12, or set PYTHON_EXECUTABLE to that python.exe.`
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
  res.json({ status: "ok", message: "Server is running" });
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

  const isFirstUser = users.length === 0;
  const newUser = createUser({
    name: req.body.name,
    email: normalizedEmail,
    password: req.body.password,
    role: isFirstUser ? "admin" : "user",
    accessStatus: isFirstUser ? "approved" : "pending",
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
  const userId = Number(req.params.id);
  const users = loadUsers();
  const target = users.find((user) => user.id === userId);

  if (!target) {
    res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found." });
    return;
  }

  const accessStatus = ["approved", "pending"].includes(req.body.accessStatus) ? req.body.accessStatus : target.accessStatus;
  const role = ["admin", "user"].includes(req.body.role) ? req.body.role : target.role;

  const updatedUsers = users.map((user) => (
    user.id === userId ? { ...user, accessStatus, role } : user
  ));

  saveUsers(updatedUsers);
  res.json({ users: updatedUsers.map(publicUser) });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (req.user.id === userId) {
    res.status(400).json({ error: "SELF_DELETE", message: "You cannot delete your own admin account." });
    return;
  }

  const users = loadUsers();
  const updatedUsers = users.filter((user) => user.id !== userId);
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
      fs.unlinkSync(path.join(CACHE_DIR, file));
      deletedCount++;
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎵 Server running on http://localhost:${PORT}`);
  console.log(`Cache directory: ${CACHE_DIR}`);
  console.log(`History file: ${HISTORY_FILE}`);
  console.log(`Python executable: ${defaultPythonExecutable || "not found"}`);
});
