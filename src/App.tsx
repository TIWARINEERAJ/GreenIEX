import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ChakraProvider } from '@chakra-ui/react';
import Navigation from './components/common/Navigation';
import Dashboard from './features/dashboard/Dashboard';
import TradingPortal from './features/trading/TradingPortal';
import RECMarket from './features/rec/RECMarket';
import CarbonImpact from './features/carbon/CarbonImpact';
import Login from './features/auth/Login';
import { AuthProvider } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Box minH="100vh">
            <Navigation />
            <Box as="main" p={4}>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/trading" element={<TradingPortal />} />
                  <Route path="/rec-market" element={<RECMarket />} />
                  <Route path="/carbon-impact" element={<CarbonImpact />} />
                </Route>
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
