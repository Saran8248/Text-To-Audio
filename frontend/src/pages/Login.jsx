import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "../utils/motion";
import { toast } from "react-toastify";
import { loginUser } from "../utils/auth";
import { Eye, EyeOff } from "lucide-react";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await loginUser({ email, password });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    onLogin(result.user);
    toast.success("Logged in successfully");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl border border-white/10"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">Terra Tern</h1>
          <p className="mt-3 text-gray-400">
            Log in to access your sound generation dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 my-auto flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold"
          >
            Log In
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          New here?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-200">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
