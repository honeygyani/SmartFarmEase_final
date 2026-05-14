import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import getTheme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ColorModeContext } from './contexts/ColorModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import GoogleTranslate from './components/GoogleTranslate';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerHome from './pages/FarmerHome';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerHome from './pages/CustomerHome';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import FertilizerPrediction from './pages/FertilizerPrediction';
import SowingWindow from './pages/SowingWindow';
import MyOrders from './pages/MyOrders';
import './App.css';

function App() {
  const [mode, setMode] = useState('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />

              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Farmer-only routes */}
                  <Route path="/farmer-home" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><FarmerHome /></ProtectedRoute>} />
                  <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><FarmerDashboard /></ProtectedRoute>} />
                  <Route path="/farmer-dashboard" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><FarmerDashboard /></ProtectedRoute>} />
                  <Route path="/crop-recommendation" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><CropRecommendation /></ProtectedRoute>} />
                  <Route path="/disease-detection" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><DiseaseDetection /></ProtectedRoute>} />
                  <Route path="/fertilizer-prediction" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><FertilizerPrediction /></ProtectedRoute>} />
                  <Route path="/sowing-window" element={<ProtectedRoute allowedRoles={['farmer', 'admin']}><SowingWindow /></ProtectedRoute>} />

                  {/* Customer-only routes */}
                  <Route path="/customer-home" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerHome /></ProtectedRoute>} />
                  <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/customer-dashboard" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer', 'admin']}><MyOrders /></ProtectedRoute>} />
                </Routes>
              </Box>
            </Box>
            <GoogleTranslate />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
