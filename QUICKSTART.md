# 🚀 SoundMind - Quick Start Guide

## What Was Transformed

Your basic Text-to-Speech app has been completely redesigned into **SoundMind**, a modern AI SaaS platform with:

✨ **Professional UI** - Dark theme, glassmorphism cards, smooth animations
📱 **Responsive Design** - Works on all devices
🎙️ **Enhanced Features** - Voice library, history, API keys, settings
⚡ **Optimized Backend** - Caching, history tracking, better error handling
🎨 **Modern Stack** - React, Tailwind CSS, Framer Motion

---

## 📋 Prerequisites

Before running the app, make sure you have:

- **Node.js 14+** - [Download](https://nodejs.org/)
- **Python 3.12+** - [Download](https://www.python.org/)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

Verify installation:
```bash
node --version    # Should show v14+
python --version  # Should show 3.12+
npm --version     # Should show 8+
```

---

## ⚡ Quick Setup (Recommended)

### For Windows Command Prompt:
```bash
cd "C:\Users\sksar\Desktop\Text-to-Audio"
setup.bat
```

### For Windows PowerShell:
```powershell
cd "C:\Users\sksar\Desktop\Text-to-Audio"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\setup.ps1
```

The script will:
1. ✅ Check for Node.js and Python
2. ✅ Install backend dependencies (npm packages + Python packages)
3. ✅ Install frontend dependencies (npm packages)
4. ✅ Display next steps

---

## 🔧 Manual Setup (If Script Doesn't Work)

### Step 1: Setup Backend

```bash
cd Backend
npm install
pip install -r requirements.txt
```

If your Python executable isn't on PATH or you use a virtual environment, set the `PYTHON_EXECUTABLE` environment variable to the full path before starting the server. Example (PowerShell):

```powershell
$env:PYTHON_EXECUTABLE = "C:\\path\\to\\python.exe"
```

Ensure `edge-tts` is installed (the setup script installs it, otherwise install manually):

```bash
pip install --upgrade edge-tts
```

### Step 2: Setup Frontend

```bash
cd frontend
npm install
```

---

## 🎬 Running the Application

You need **two separate terminals**:

### Terminal 1 - Start Backend Server
```bash
cd Backend
npm start
```

Expected output:
```
🎵 Server running on http://localhost:5000
Cache directory: ./cache
History file: ./history.json
```

### Terminal 2 - Start Frontend App
```bash
cd frontend
npm start
```

Your browser should automatically open to http://localhost:3000

---

## 🎨 What You'll See

### Main Pages:

1. **Dashboard** 📊
   - Welcome banner
   - Usage statistics cards
   - Weekly usage chart
   - Recent generated audios
   - AI status section

2. **Text to Speech** 🎙️
   - Large text editor (5000 char limit)
   - Language selector
   - Voice selector
   - Speed control (0.5x - 2x)
   - Pitch control
   - Audio player
   - Download button

3. **Voice Library** 🎵
   - Browse 10+ voices
   - Filter by gender/language
   - Play samples
   - Favorite voices
   - Voice descriptions

4. **History** 📜
   - View all generated audios
   - Search functionality
   - Filter by language
   - Download old audios
   - Delete from history

5. **API Keys** 🔑
   - View/create API keys
   - Copy to clipboard
   - Manage keys securely
   - API documentation

6. **Settings** ⚙️
   - Profile settings
   - Preferences (default voice, speed)
   - Theme selection
   - Notifications
   - Security settings

### Navigation
- **Sidebar** (left) - Navigate to different pages
- **Navbar** (top) - Search, notifications, profile menu
- **Responsive** - Hamburger menu on mobile

---

## 🎯 First Use Steps

1. **Navigate to Text to Speech** - Click "Text to Speech" in sidebar
2. **Enter some text** - Type or paste your text
3. **Select a voice** - Choose from the available voices
4. **Generate audio** - Click "Generate Audio" button
5. **Listen** - Use the player on the right to preview
6. **Download** - Click "Download MP3" to save the file

---

## 🔊 Available Voices

### English (US)
- Jenny (Female) 🎤
- Guy (Male) 🎤

### English (UK)
- Sonia (Female) 🎤
- Ryan (Male) 🎤

### German
- Katja (Female) 🎤
- Conrad (Male) 🎤

### French
- Denise (Female) 🎤
- Henri (Male) 🎤

### Japanese
- Nanami (Female) 🎤
- Keita (Male) 🎤

---

## 🚨 Troubleshooting

### "Cannot find module 'react-router-dom'"
**Solution:** Run `npm install` in the frontend folder
```bash
cd frontend
npm install
```

### "Port 5000 already in use"
**Solution:** Kill the existing process or use a different port
```bash
# On Windows
netstat -ano | findstr :5000
# Find the PID and kill it
taskkill /PID <PID> /F

# Or change port in server.js: app.listen(5001, ...)
```

### "Port 3000 already in use"
**Solution:** Let React use a different port (it will ask)
```
? Something is already running on port 3000. Would you like to run it on another port instead? › (Y/n)
```
Press `Y`

### "Python not found"
**Solution:** Reinstall Python and add to PATH
```bash
# After reinstalling Python, restart terminal
python --version
pip install edge-tts
```

### "Edge-tts error"
**Solution:** Verify installation
```bash
pip install --upgrade edge-tts
```

### "Application is blank/white screen"
**Solution:** 
1. Check browser console (F12) for errors
2. Verify backend is running
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart both servers

---

## 📝 Configuration

### Frontend (.env file)
Create `frontend/.env` (optional):
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_APP_NAME=SoundMind
```

### Backend (in server.js)
Key settings you can modify:
```javascript
const CACHE_DIR = path.join(__dirname, "cache");  // Cache location
const MAX_TEXT_LENGTH = 5000;  // Max text length
const REQUEST_TIMEOUT = 30000;  // 30 seconds
```

---

## 🔄 Updating Dependencies

### Update frontend packages:
```bash
cd frontend
npm update
```

### Update backend packages:
```bash
cd Backend
npm update
pip install --upgrade -r requirements.txt
```

---

## 📁 File Structure

```
Text-to-Audio/
├── Backend/
│   ├── server.js (✨ Enhanced)
│   ├── edge_tts_generator.py
│   ├── package.json
│   ├── requirements.txt
│   ├── cache/ (auto-created)
│   └── history.json (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx (✨ New)
│   │   │   └── Navbar.jsx (✨ New)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx (✨ New)
│   │   │   ├── TextToSpeech.jsx (✨ New)
│   │   │   ├── VoiceLibrary.jsx (✨ New)
│   │   │   ├── History.jsx (✨ New)
│   │   │   ├── APIKeys.jsx (✨ New)
│   │   │   └── Settings.jsx (✨ New)
│   │   ├── App.js (✨ Updated)
│   │   └── index.css (✨ Updated with Tailwind)
│   ├── tailwind.config.js (✨ New)
│   ├── postcss.config.js (✨ New)
│   └── package.json (✨ Updated)
│
├── README.md (✨ Updated)
├── setup.bat (✨ New)
└── setup.ps1 (✨ New)
```

---

## 🎨 Customization Ideas

### Change Colors
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  accent: {
    blue: '#your-blue',      // Primary color
    purple: '#your-purple',  // Secondary
    cyan: '#your-cyan',      // Accent
    pink: '#your-pink',      // Highlight
  }
}
```

### Add More Voices
Edit `Backend/server.js` voiceMap object

### Change Branding
- Sidebar logo: `frontend/src/components/Sidebar.jsx`
- App name: `REACT_APP_APP_NAME` in `.env`

### Add New Page
1. Create file in `frontend/src/pages/`
2. Add route in `frontend/src/App.js`
3. Add menu item in `frontend/src/components/Sidebar.jsx`

---

## 🚀 Next Steps

### Immediate (Today)
- [ ] Run setup script
- [ ] Start both servers
- [ ] Test audio generation
- [ ] Explore all pages

### Short Term (This Week)
- [ ] Customize colors/branding
- [ ] Add more voices
- [ ] Test on mobile
- [ ] Try all features

### Medium Term (This Month)
- [ ] Deploy to cloud (Heroku, AWS, Azure, etc.)
- [ ] Add user authentication
- [ ] Implement API key validation
- [ ] Add database for persistent storage

### Long Term
- [ ] Monetization (API pricing)
- [ ] Advanced features (batch processing, voice cloning)
- [ ] Mobile app
- [ ] Integration with other services

---

## 📚 Resources

- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion/
- **Express.js**: https://expressjs.com
- **Edge-TTS**: https://github.com/rany2/edge-tts

---

## 💡 Tips & Tricks

1. **Faster Development**
   - Use React DevTools browser extension
   - Use VS Code REST Client to test APIs

2. **Better Performance**
   - Cache is automatically used for repeated text
   - Audio files are kept in `Backend/cache/`
   - Clear cache manually: Send POST to `/api/cache/clear`

3. **Debugging**
   - Open browser DevTools (F12)
   - Check Console tab for frontend errors
   - Check Terminal for backend errors
   - Network tab shows API calls

4. **Production Ready**
   - Build frontend: `npm run build`
   - Set NODE_ENV=production
   - Use environment variables for configuration
   - Set up proper logging

---

## 🆘 Still Having Issues?

1. **Check the README.md** - Comprehensive documentation
2. **Check server logs** - Look at Terminal output
3. **Check browser console** - F12 → Console tab
4. **Restart everything** - Kill servers, restart terminals
5. **Clear cache** - Delete `node_modules`, run `npm install` again

---

## ✅ You're All Set!

Your SoundMind application is ready to use. Enjoy your modern AI SaaS Text-to-Speech platform! 🎉

For more details, see the full **README.md** in the project folder.

---

**Happy coding! 🚀**
