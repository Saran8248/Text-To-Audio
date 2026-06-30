# SoundMind - Modern AI Text-to-Speech Application

A production-ready, modern AI SaaS-style Text-to-Speech application built with React, Tailwind CSS, and Node.js. Features a sleek dark theme, glassmorphism UI, smooth animations, and comprehensive voice management.

## 🎯 Features

### Frontend
- ✨ **Modern Dark Theme** - Glassmorphism cards, gradient buttons, smooth animations
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- 🎬 **Smooth Animations** - Powered by Framer Motion for professional feel
- 🎨 **Tailwind CSS** - Modern utility-first styling with custom components
- 🛣️ **Multi-page Application** - Dashboard, Text-to-Speech, Voice Library, History, Settings
- 📊 **Analytics & Stats** - Real-time usage statistics and charts
- 🎙️ **Voice Management** - Browse, filter, and manage multiple voices
- 🔐 **API Management** - Secure API key management interface
- ⚙️ **Settings Panel** - Comprehensive user preferences and configuration
- 🔔 **Toast Notifications** - Real-time user feedback

### Backend
- 🚀 **RESTful API** - Clean, well-structured API endpoints
- 💾 **Audio Caching** - Intelligent caching system for repeated requests
- 📝 **History Tracking** - Keep track of generated audio files
- ✅ **Request Validation** - Comprehensive input validation and error handling
- 🛡️ **Error Handling** - Detailed error messages and graceful degradation
- ⏱️ **Request Timeout** - Protection against long-running requests
- 📊 **Server Stats** - Monitor cache usage and system health
- 🔄 **Backward Compatibility** - Legacy endpoints supported

## 📋 Requirements

- Node.js 14+ and npm
- Python 3.12+
- edge-tts library
- Coqui XTTS-v2 via `TTS` package for multilingual generation

## 🚀 Installation

### Backend Setup

1. Navigate to the Backend folder:
```bash
cd Backend
npm install
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
npm install
```

2. Create `.env` file in the frontend folder (if needed):
```
REACT_APP_API_URL=http://localhost:5000
```

## 🏃 Running the Application

### Start the Backend Server
```bash
cd Backend
npm start
```
Server will run on `http://localhost:5000`

### Start the Frontend Development Server
```bash
cd frontend
npm start
```
Application will open on `http://localhost:3000`

## 📁 Project Structure

```
project/
├── Backend/
│   ├── server.js              # Main Express server with improved API
│   ├── edge_tts_generator.py  # Python TTS generator
│   ├── package.json
│   ├── requirements.txt
│   ├── cache/                 # Audio cache directory
│   └── history.json           # Generation history
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx     # Navigation sidebar
    │   │   └── Navbar.jsx      # Top navigation bar
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Main dashboard
    │   │   ├── TextToSpeech.jsx    # TTS converter
    │   │   ├── VoiceLibrary.jsx    # Voice browser
    │   │   ├── History.jsx         # Audio history
    │   │   ├── APIKeys.jsx         # API key management
    │   │   └── Settings.jsx        # User settings
    │   ├── App.js              # Main app with routing
    │   ├── index.js            # Entry point
    │   ├── index.css           # Tailwind styles
    │   └── App.css             # Empty (using Tailwind)
    ├── public/
    ├── package.json
    ├── tailwind.config.js      # Tailwind configuration
    └── postcss.config.js       # PostCSS configuration
```

## 🎨 UI Components

### Layouts
- **Sidebar** - Collapsible navigation with smooth animations
- **Navbar** - Top bar with notifications and profile dropdown
- **Main Layout** - Responsive grid layout

### Pages
- **Dashboard** - Overview with stats, charts, and recent activity
- **Text-to-Speech** - Main converter with voice/language selection
- **Voice Library** - Browse and filter available voices
- **History** - Manage previously generated audio
- **API Keys** - Manage API credentials
- **Settings** - User preferences and configuration

### Features
- Glass-morphism cards with backdrop blur
- Gradient buttons and text
- Smooth page transitions
- Loading animations
- Toast notifications
- Responsive mobile menu
- Dark theme with purple/blue accent colors

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server status

### Audio Generation
- `POST /api/tts/generate` - Generate audio
- `POST /convert` - Legacy endpoint (backward compatible)

### Data Management
- `GET /api/tts/history` - Get generation history
- `GET /api/tts/voices` - Get available voices
- `POST /api/cache/clear` - Clear audio cache
- `GET /api/stats` - Server statistics

## 📊 Request Format

### Generate Audio
```json
{
  "text": "Your text here",
  "voice": "en-US-JennyNeural"
}
```

### Response
- Status 200: MP3 audio file
- Status 400: Invalid request
- Status 500: Server error with detailed message

## 🎙️ Available Voices

### English (US)
- en-US-JennyNeural (Female)
- en-US-GuyNeural (Male)

### English (UK)
- en-GB-SoniaNeural (Female)
- en-GB-RyanNeural (Male)

### German
- de-DE-KatjaNeural (Female)
- de-DE-ConradNeural (Male)

### French
- fr-FR-DeniseNeural (Female)
- fr-FR-HenriNeural (Male)

### Japanese
- ja-JP-NanamiNeural (Female)
- ja-JP-KeitaNeural (Male)

## ⚙️ Configuration

### Backend (.env or defaults)
- PORT: 5000
- MAX_TEXT_LENGTH: 5000 characters
- REQUEST_TIMEOUT: 30 seconds
- CACHE_DIR: ./cache
- HISTORY_FILE: ./history.json

### Frontend
- React Router for client-side routing
- Axios for API calls
- Framer Motion for animations
- React Toastify for notifications
- Recharts for analytics

## 🔒 Security Features

- Input validation and sanitization
- CORS configuration
- Timeout protection
- Error message masking in production
- API key management interface

## 📈 Performance

- Audio caching reduces generation time
- Responsive image optimization
- Code splitting with React Router
- Tailwind CSS purging for minimal bundle

## 🐛 Troubleshooting

### Frontend won't load
1. Check if backend is running on port 5000
2. Verify REACT_APP_API_URL is correct
3. Clear npm cache: `npm cache clean --force`
4. Reinstall dependencies: `npm install`

### Audio generation fails
1. Verify Python 3.12+ is installed
2. Check edge-tts is installed: `pip install edge-tts`
3. Check Python path in server.js matches your system
4. Verify text is not empty and under 5000 characters

### No voices available
1. Ensure backend is running
2. Check `/api/tts/voices` endpoint responds
3. Verify voice names match the backend mapping

## 🚀 Production Deployment

### Before deploying:
1. Set NODE_ENV=production
2. Update CORS origins
3. Configure environment variables
4. Build frontend: `npm run build`
5. Test all endpoints
6. Set up monitoring and logging

### Building Frontend
```bash
cd frontend
npm run build
```

The build folder contains optimized production files.

## 📝 License

This project is for educational and personal use.

## 🤝 Support

For issues or questions, check the console for error messages and API response details.

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Status**: Production Ready
