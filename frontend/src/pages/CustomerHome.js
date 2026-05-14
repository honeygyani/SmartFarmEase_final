import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Container, Typography, Box, Button, Card, CardContent,
  Stack, Chip, Fade, useTheme, Avatar, Grid
} from '@mui/material';
import {
  Storefront, ShoppingCart, ArrowForward,
  Groups, Verified, Search, TrendingUp, LocalShipping, Assessment, VerifiedUser
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { FadeIn, StaggerContainer, HoverLift, ScaleIn } from '../components/MotionWrappers';
import { motion } from 'framer-motion';

const BlurBlob = ({ color, top, left, right, bottom, size = 300, opacity = 0.15 }) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      filter: 'blur(80px)',
      opacity: opacity,
      zIndex: 0,
      pointerEvents: 'none',
      top, left, right, bottom
    }}
  />
);

const CustomerHome = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();


  const features = [
    {
      title: 'Browse Farmer Lobbies',
      description: 'Explore available farmer collectives, view crop quality scores, and negotiate fair prices directly.',
      icon: <Groups sx={{ fontSize: 40 }} />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF620, #7C3AED10)',
      path: '/customer-dashboard'
    },
    {
      title: 'Create Sourcing Request',
      description: 'Post what you need — quantity, commodity, and budget. Let farmers come to you.',
      icon: <Search sx={{ fontSize: 40 }} />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B98120, #05966910)',
      path: '/customer-dashboard'
    },
    {
      title: 'Buy from Marketplace',
      description: 'Purchase directly from verified farmer listings with transparent quality scores and pricing.',
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F620, #2563EB10)',
      path: '/customer-dashboard'
    },
    {
      title: 'Track Your Orders',
      description: 'Monitor order status from placement to delivery with real-time tracking updates.',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B20, #D9770610)',
      path: '/customer-dashboard'
    },
  ];

  return (
    <Box sx={{ 
      backgroundColor: 'background.default', 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Elements */}
      <BlurBlob color="#3B82F6" top="-100px" right="-50px" size={400} opacity={0.05} />
      <BlurBlob color="#8B5CF6" bottom="10%" left="-100px" size={500} opacity={0.04} />
      <BlurBlob color="#10B981" top="40%" right="10%" size={350} opacity={0.03} />

      {/* ─── Hero Banner ─── */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 12 },
          pb: { xs: 12, md: 20 },
          color: 'white',
          background: 'linear-gradient(145deg, #1E293B 0%, #334155 45%, #475569 100%)',
          borderRadius: '0 0 60px 60px',
          boxShadow: '0 20px 50px -20px rgba(30, 41, 59, 0.2)',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.2,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <FadeIn direction="up" distance={30} duration={0.8}>
            <Box>
              <ScaleIn delay={0.2}>
                <Chip
                  icon={<Verified sx={{ fontSize: '0.9rem !important', color: '#3B82F6 !important' }} />}
                  label="VERIFIED BUYER ACCOUNT"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: '#1E3A8A',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    letterSpacing: 1.2,
                    px: 1,
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)', boxShadow: '0 6px 15px rgba(0,0,0,0.15)' }
                  }}
                />
              </ScaleIn>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  mb: 2.5,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  color: '#FFFFFF'
                }}
              >
                Welcome back, <Box component="span" sx={{ color: '#93C5FD' }}>{user?.full_name?.split(' ')[0] || 'Customer'}</Box>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  fontSize: { xs: '1.1rem', md: '1.35rem' },
                  maxWidth: 650,
                  mb: 6,
                  color: '#DBEAFE'
                }}
              >
                Source fresh produce directly from farmer collectives. Secure your supply chain with transparent quality and pricing.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Storefront />}
                  onClick={() => navigate('/customer-dashboard')}
                  sx={{
                    py: 2,
                    px: 5,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '16px',
                    backgroundColor: 'white',
                    color: '#1E40AF',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#EFF6FF',
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(0.98)',
                    }
                  }}
                >
                  Enter Sourcing Hub
                </Button>
              </Stack>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── Features Section (Horizontal Deck) ─── */}
      <Container maxWidth="xl" sx={{ mt: 8, position: 'relative', zIndex: 2, mb: 12 }}>
        <Box sx={{ mb: 4, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 3, display: 'block', mb: 1 }}
            >
              SOURCING TOOLS
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', textTransform: 'uppercase' }}
            >
              Direct Farmer Access
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#999', fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
            Scroll to explore →
          </Typography>
        </Box>

        <StaggerContainer staggerDelay={0.15}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3.5,
              overflowX: 'auto',
              pb: 6,
              pt: 2,
              px: { xs: 2, md: 4 },
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { display: 'none' },
              width: '100%',
              flexWrap: 'nowrap'
            }}
          >
            {features.map((item, index) => (
            <Box 
              component={motion.div}
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 20 },
                show: { opacity: 1, scale: 1, y: 0 }
              }}
              key={index} 
              sx={{ flex: '0 0 auto', width: { xs: 300, md: 360 }, scrollSnapAlign: 'start' }}
            >
              <HoverLift>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 7,
                      border: `1px solid ${item.color}30`,
                      background: theme.palette.background.paper,
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark' 
                        ? `0 30px 60px -15px ${item.color}30` 
                        : `0 30px 60px -15px rgba(0,0,0,0.08)`,
                      borderColor: 'primary.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,1)',
                      '& .feature-icon-bg': {
                        transform: 'rotate(8deg) scale(1.1)',
                        backgroundColor: item.color,
                        color: 'black',
                      },
                      '& .feature-arrow': {
                        transform: 'translateX(5px)',
                        opacity: 1,
                        color: 'primary.main'
                      }
                    }
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                    <Box
                      className="feature-icon-bg"
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 5,
                        background: item.gradient,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 4,
                        transition: 'all 0.5s ease',
                        boxShadow: `0 8px 20px -6px ${item.color}40`,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', fontSize: '1.25rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 4, fontSize: '0.95rem' }}>
                      {item.description}
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      size="small"
                      endIcon={<ArrowForward className="feature-arrow" />}
                      sx={{ 
                        borderRadius: 10,
                        px: 3,
                        py: 1,
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        '&:hover': {
                          bgcolor: item.color,
                          color: 'black'
                        }
                      }}
                    >
                      Explore Now
                    </Button>
                  </CardContent>
                </Card>
              </HoverLift>
            </Box>
          ))}
          </Box>
        </StaggerContainer>
      </Container>

      {/* ─── Marketplace CTA ─── */}
      <Container maxWidth="lg" sx={{ pb: 15, position: 'relative', zIndex: 1 }}>
        <Card
          sx={{
            borderRadius: 10,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' 
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 40px 80px -20px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box sx={{ 
            position: 'absolute', 
            top: -50, 
            right: -50, 
            width: 200, 
            height: 200, 
            bgcolor: '#3B82F608', 
            borderRadius: '50%' 
          }} />
          
          <CardContent sx={{ p: { xs: 5, md: 8 } }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56, boxShadow: `0 8px 16px ${theme.palette.info.main}40` }}>
                    <Storefront sx={{ fontSize: 32, color: '#ffffff' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Centralized Sourcing
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8, mb: 5, maxWidth: 550 }}>
                  Access thousands of verified farmers. Browse active lobbies, participate in deal rooms, and manage your bulk procurement with military-grade precision.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/customer-dashboard')}
                  sx={{
                    py: 2.2,
                    px: 6,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '18px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'info.main' : 'text.primary',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : 'background.paper',
                    boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.3)',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'info.light' : '#1E293B',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                    }
                  }}
                >
                  Go to Sourcing Hub
                </Button>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={2.5}>
                    {[
                      { icon: <LocalShipping sx={{ color: '#3B82F6' }} />, label: 'Logistics Ready', desc: 'Track delivery in real-time' },
                      { icon: <VerifiedUser sx={{ color: '#10B981' }} />, label: 'Verified Quality', desc: 'Certified grade-A farm produce' },
                      { icon: <Groups sx={{ color: '#8B5CF6' }} />, label: 'Direct Negotiation', desc: 'Chat with collectives' },
                    ].map((feat, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 3,
                        borderRadius: 5,
                        bgcolor: 'background.paper',
                        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.02)',
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateX(10px)',
                          borderColor: '#3B82F640',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.04)',
                        }
                      }}
                    >
                      <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderRadius: 3 }}>
                        {feat.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                          {feat.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {feat.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CustomerHome;
