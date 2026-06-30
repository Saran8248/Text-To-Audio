import React, { useState } from 'react';
import { motion } from '../utils/motion';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
const APIKeys = () => {
  const [keys, setKeys] = useState([
    {
      id: 1,
      name: 'Production Key',
      key: '••••••••••••••••••••••••',
      created: '2024-01-10',
      lastUsed: '2 hours ago',
    },
    {
      id: 2,
      name: 'Development Key',
      key: '••••••••••••••••••••••••',
      created: '2024-01-05',
      lastUsed: '1 day ago',
    },
  ]);

  const deleteKey = (id) => {
    setKeys(keys.filter((k) => k.id !== id));
    toast.success('API key deleted');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">API Keys</h1>
        <p className="text-gray-400">Manage your API keys for accessing the Text-to-Speech service</p>
      </motion.div>

      {/* Create New Key */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-blue-500/30"
      >
        <Plus size={20} />
        Create New API Key
      </motion.button>

      {/* API Keys List */}
      <div className="space-y-4">
        {keys.map((apiKey, idx) => (
          <motion.div
            key={apiKey.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{apiKey.name}</h3>
                <p className="text-sm text-gray-400">Created on {apiKey.created}</p>
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Active
              </div>
            </div>

            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-300 font-medium">
                API key values are hidden in the UI for security.
              </p>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Last used: {apiKey.lastUsed}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => deleteKey(apiKey.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Documentation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">API Documentation</h3>
        <div className="space-y-4 text-gray-300">
          <div>
            <p className="font-medium text-white mb-2">Authentication</p>
            <p className="text-sm">Include your API key in the Authorization header:</p>
            <code className="block mt-2 p-3 bg-dark-800 rounded text-sm text-gray-200 overflow-x-auto">
              Authorization: Bearer your_api_key_here
            </code>
          </div>
          <div>
            <p className="font-medium text-white mb-2">Example Request</p>
            <code className="block p-3 bg-dark-800 rounded text-sm text-gray-200 overflow-x-auto">
{`POST /api/tts/generate
{
  "text": "Hello world",
  "voice": "en-US-JennyNeural"
}`}
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default APIKeys;
