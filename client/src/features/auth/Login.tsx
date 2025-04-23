import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { User } from '../../types/user';

interface LoginProps {
  onLoginSuccess?: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Subscribe to auth changes
    const unsubscribe = authService.subscribeToAuthChanges((updatedUser) => {
      setUser(updatedUser);
      if (updatedUser && onLoginSuccess) {
        onLoginSuccess(updatedUser);
      }
    });

    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (user) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {user.avatar && (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1 flex items-center">
              <span className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-green-100 text-green-800">
                {user.role}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                ₹{user.balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Login</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <select
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a demo account</option>
            <option value="solar@example.com">Solar Producer</option>
            <option value="wind@example.com">Wind Farm</option>
            <option value="buyer@example.com">Energy Buyer</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Use any password for demo"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
