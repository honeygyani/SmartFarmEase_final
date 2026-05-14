import React, { useContext, useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  Agriculture,
  Logout,
  Home,
  AccountCircle,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { ColorModeContext } from '../contexts/ColorModeContext';
import { useTheme } from '@mui/material/styles';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/');
  };

  const isFarmer = user && (user.role === 'farmer' || user.role === 'admin');
  const isCustomer = user && (user.role === 'customer' || user.role === 'admin');

  const homeRoute = isFarmer ? '/farmer-home' : isCustomer ? '/customer-home' : '/';

  const isTransparent = !user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: scrolled 
          ? (theme.palette.mode === 'dark' ? 'rgba(8, 8, 8, 0.8)' : 'rgba(255, 255, 255, 0.8)')
          : 'transparent',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : 'none',
        color: theme.palette.text.primary,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        mt: scrolled ? 0 : 2,
        mx: 'auto',
        width: scrolled ? '100%' : 'calc(100% - 40px)',
        borderRadius: scrolled ? 0 : 6,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 80 }}>
          {/* ─── Logo ─── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: theme.palette.text.primary,
              gap: 2
            }}
            component={RouterLink}
            to={homeRoute}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 4,
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 24px rgba(163, 230, 53, 0.2)',
              }}
            >
              <Agriculture sx={{ color: 'black', fontSize: 26 }} />
            </Box>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.02em',
                display: { xs: 'none', md: 'block' },
                fontSize: '1.4rem',
                color: theme.palette.text.primary
              }}
            >
              SmartFarm<Box component="span" sx={{ color: 'primary.main' }}>Ease</Box>
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* ─── Right Side ─── */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
              <IconButton 
                onClick={colorMode.toggleColorMode} 
                sx={{ 
                  color: 'primary.main',
                  bgcolor: 'rgba(163, 230, 53, 0.05)',
                  '&:hover': { bgcolor: 'rgba(163, 230, 53, 0.1)' }
                }}
              >
                {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {user ? (
              /* ─── Authenticated: Home link + Avatar ─── */
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Home">
                  <IconButton
                    component={RouterLink}
                    to={homeRoute}
                    sx={{
                      color: location.pathname === homeRoute ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        color: 'primary.main',
                        backgroundColor: 'rgba(163, 230, 53, 0.08)',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <Home />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Account">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 40,
                        height: 40,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      mt: 1.5,
                      minWidth: 200,
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 10px 30px rgba(0,0,0,0.4)' 
                        : '0 10px 30px rgba(0,0,0,0.05)',
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: theme.palette.background.paper,
                      backgroundImage: 'none'
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {user.full_name || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase' }}>
                      {user.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                    <Logout fontSize="small" sx={{ mr: 1.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              /* ─── Unauthenticated: Login + Sign Up ─── */
              <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{ fontWeight: 700, px: 2, color: theme.palette.text.primary }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{ fontWeight: 700, px: 2, borderRadius: 2 }}
                >
                  Sign Up
                </Button>
              </Stack>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
