
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
