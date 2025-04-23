import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TradingPortal from './features/trading/TradingPortal';
import RECMarket from './features/rec/RECMarket';
import Login from './features/auth/Login';
import { authService } from './services/auth';
import { User } from './types/user';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-green-600">GreenIEX</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-green-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Trading Portal
                  </Link>
                  <Link to="/rec" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    REC Market
                  </Link>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <div className="-mr-2 flex items-center sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Trading Portal
              </Link>
              <Link
                to="/rec"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                REC Market
              </Link>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar with login */}
                <div className="md:col-span-1">
                  <Login />
                </div>
                
                {/* Main content */}
                <div className="md:col-span-3">
                  <Routes>
                    <Route path="/" element={<TradingPortal />} />
                    <Route path="/rec" element={<RECMarket />} />
                  </Routes>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
