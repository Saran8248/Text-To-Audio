import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TextToSpeech from './pages/TextToSpeech';
import VoiceLibrary from './pages/VoiceLibrary';
import History from './pages/History';
import Settings from './pages/Settings';
import AdminAccess from './pages/AdminAccess';
import MergeAudio from './pages/MergeAudio';
import MultiSpeaker from './pages/MultiSpeaker';
import AudioToText from './pages/AudioToText';
import Login from './pages/Login';
import Register from './pages/Register';
import { getCurrentUser, isAdmin, logout as authLogout, refreshCurrentUser } from './utils/auth';

const RequireAuth = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const RequireAdmin = ({ user, children }) => {
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedLayout = ({ user, onLogout, onUpdateUser, theme, onThemeChange }) => (
  <div className={`flex h-screen ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-dark-950 text-white'}`}>
    <Sidebar user={user} onLogout={onLogout} />
    <div className="flex flex-col flex-1 overflow-hidden">
      <Navbar user={user} onLogout={onLogout} theme={theme} onToggleTheme={onThemeChange} />
      <main className={`${theme === 'light' ? 'bg-slate-100' : 'bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950'} flex-1 overflow-y-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/tts" element={<TextToSpeech />} />
            <Route path="/multi-speaker" element={<MultiSpeaker />} />
            <Route path="/voices" element={<VoiceLibrary />} />
            <Route path="/history" element={<History />} />
            <Route path="/merge" element={<MergeAudio user={user} />} />
            <Route path="/transcribe" element={<AudioToText />} />
            <Route path="/api-keys" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<RequireAdmin user={user}><AdminAccess currentUser={user} onUpdateUser={onUpdateUser} /></RequireAdmin>} />
            <Route path="/settings" element={<Settings user={user} onUpdateUser={onUpdateUser} theme={theme} onThemeChange={onThemeChange} onLogout={onLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [theme, setTheme] = useState(() => localStorage.getItem('terra_tern_theme') || 'dark');

  useEffect(() => {
    refreshCurrentUser()
      .then((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        authLogout();
        setUser(null);
      });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem('terra_tern_theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
  };

  const handleThemeToggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/register" element={<Register onRegister={setUser} />} />
        <Route
          path="/*"
          element={
            <RequireAuth user={user}>
              <ProtectedLayout user={user} onLogout={handleLogout} onUpdateUser={setUser} theme={theme} onThemeChange={handleThemeToggle} />
            </RequireAuth>
          }
        />
      </Routes>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Router>
  );
}

export default App;
