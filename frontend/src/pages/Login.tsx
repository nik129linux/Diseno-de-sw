import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authApi.login({ email, password });
      
      // Expected response: { user: { id, email, role }, accessToken, refreshToken }
      login(data.user, data.accessToken, data.refreshToken);

      if (data.user.role === 'ROLE_ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001f3f] text-white px-4">
      <div className="w-full max-w-md p-8 bg-[#003366] rounded-xl shadow-2xl border border-blue-500/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">DataShield AI</h1>
          <p className="text-blue-200">Secure LLM Middleware Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-2 rounded-lg bg-[#001f3f] border border-blue-400/30 text-white placeholder-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                placeholder="name@company.com…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                spellCheck={false}
                autoComplete="email"
              />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-2 rounded-lg bg-[#001f3f] border border-blue-400/30 text-white placeholder-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500 rounded-lg">
              {error}
            </div>
          )}

           <button
             type="submit"
             disabled={isLoading}
             className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
           >
             {isLoading ? 'Authenticating…' : 'Sign In'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
