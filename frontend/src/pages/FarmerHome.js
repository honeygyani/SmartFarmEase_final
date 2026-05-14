import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Container, Typography, Box, Button, Card, CardContent,
  Stack, Chip, Fade, useTheme, Avatar, Grid
} from '@mui/material';
import {
  Grass, BugReport, Science, CalendarMonth, Agriculture,
  ArrowForward, Storefront, Verified, TrendingUp, Group, Assignment
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

const FarmerHome = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();


  const aiTools = [
    {
      title: 'Crop Recommendation',
      description: 'Get AI-powered crop suggestions based on your soil data, weather, and region.',
      icon: <Grass sx={{ fontSize: 40 }} />,
      path: '/crop-recommendation',
      color: '#A3E635',
      gradient: 'linear-gradient(135deg, #A3E63520, #65A30D10)',
    },
    {
      title: 'Fertilizer Suggestion',
      description: 'Receive tailored fertilizer recommendations for optimal crop yield.',
      icon: <Science sx={{ fontSize: 40 }} />,
      path: '/fertilizer-prediction',
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #D9770620, #B4530910)',
    },
    {
      title: 'Disease Detection',
      description: 'Upload leaf images and instantly identify diseases with severity analysis.',
      icon: <BugReport sx={{ fontSize: 40 }} />,
      path: '/disease-detection',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B98120, #04785710)',
    },
    {
      title: 'Sowing Window',
      description: 'Find the ideal planting time with AI-driven weather and crop analysis.',
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      path: '/sowing-window',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B20, #D9770610)',
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
      <BlurBlob color="#10B981" top="-100px" right="-50px" size={400} opacity={0.05} />
      <BlurBlob color="#3B82F6" bottom="10%" left="-100px" size={500} opacity={0.04} />
      <BlurBlob color="#F59E0B" top="40%" right="10%" size={350} opacity={0.03} />

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
                  icon={<Verified sx={{ fontSize: '0.9rem !important', color: '#10B981 !important' }} />}
                  label="VERIFIED FARMER ACCOUNT"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: '#064E3B',
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
                }}
              >
                Welcome back, <Box component="span" sx={{ color: '#34D399' }}>{user?.full_name?.split(' ')[0] || 'Farmer'}</Box>
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
                  color: '#D1FAE5'
                }}
              >
                Supercharge your farm with precision AI tools. Manage inventory, predict markets, and grow smarter.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Storefront />}
                  onClick={() => navigate('/farmer-dashboard')}
                  sx={{
                    py: 2,
                    px: 5,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '16px',
                    backgroundColor: 'white',
                    color: '#065F46',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#F0FDF4',
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(0.98)',
                    }
                  }}
                >
                  Manage Marketplace
                </Button>
              </Stack>
            </Box>
          </FadeIn>
        </Container>
      </Box>

      {/* ─── AI Microservices Section (Horizontal Deck) ─── */}
      <Container maxWidth="xl" sx={{ mt: 8, position: 'relative', zIndex: 2, mb: 12 }}>
        <Box sx={{ mb: 4, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 3, display: 'block', mb: 1 }}
            >
              AI TOOLKIT
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', textTransform: 'uppercase' }}
            >
              Precision Intelligence
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
            {aiTools.map((tool, index) => (
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
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(101, 163, 13, 0.08)'}`,
                    background: theme.palette.background.paper,
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'dark' 
                        ? `0 30px 60px -15px ${tool.color}30` 
                        : `0 30px 60px -15px rgba(0,0,0,0.08)`,
                      borderColor: 'primary.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,1)',
                      '& .tool-icon-bg': {
                        transform: 'rotate(8deg) scale(1.1)',
                        backgroundColor: tool.color,
                        color: 'black',
                      },
                      '& .tool-arrow': {
                        transform: 'translateX(5px)',
                        opacity: 1,
                        color: 'primary.main'
                      }
                    }
                  }}
                  onClick={() => navigate(tool.path)}
                >
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                    <Box
                      className="tool-icon-bg"
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 5,
                        background: tool.gradient,
                        color: tool.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 4,
                        transition: 'all 0.5s ease',
                        boxShadow: `0 8px 20px -6px ${tool.color}40`,
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', fontSize: '1.25rem' }}>
                      {tool.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 4, fontSize: '0.95rem' }}>
                      {tool.description}
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      size="small"
                      endIcon={<ArrowForward />}
                      sx={{ 
                        borderRadius: 10,
                        px: 3,
                        py: 1,
                        bgcolor: theme.palette.mode === 'dark' ? `${tool.color}20` : `${tool.color}15`,
                        color: theme.palette.mode === 'dark' ? tool.color : 'primary.dark',
                        '&:hover': {
                          bgcolor: tool.color,
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
            bgcolor: '#10B98108', 
            borderRadius: '50%' 
          }} />
          
          <CardContent sx={{ p: { xs: 5, md: 8 } }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: `0 8px 16px ${theme.palette.primary.main}40` }}>
                    <Agriculture sx={{ fontSize: 32, color: 'primary.contrastText' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Grow Your Business
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.8, mb: 5, maxWidth: 550 }}>
                  Manage your crop inventory with ease. Publish to the global marketplace, join farmer collectives for better pricing, and track every deal in real-time.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/farmer-dashboard')}
                  sx={{
                    py: 2.2,
                    px: 6,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '18px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'primary.main' : 'text.primary',
                    color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'background.paper',
                    boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.3)',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'primary.light' : '#1E293B',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                    }
                  }}
                >
                  Open Marketplace Dashboard
                </Button>
              </Grid>
              <Grid item xs={12} md={5}>
                <Stack spacing={2.5}>
                  {[
                    { icon: <TrendingUp sx={{ color: '#10B981' }} />, label: 'Market Insights', desc: 'Real-time price trends' },
                    { icon: <Group sx={{ color: '#3B82F6' }} />, label: 'Collective Power', desc: 'Sourcing & Lobbies' },
                    { icon: <Assignment sx={{ color: '#F59E0B' }} />, label: 'Order Tracking', desc: 'End-to-end management' },
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
                          borderColor: '#10B98140',
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

export default FarmerHome;
