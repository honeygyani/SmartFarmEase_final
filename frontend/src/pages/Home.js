import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, ScaleIn } from '../components/MotionWrappers';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Stack,
  useTheme,
  Chip
} from '@mui/material';
import {
  Agriculture,
  TrendingUp,
  Speed,
  Verified,
  ArrowForward
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const howItWorks = [
    {
      step: '01',
      title: 'Collect Data',
      description: 'Synchronize soil metrics, crop visuals, and sourcing logs into the core.',
      icon: <Agriculture sx={{ fontSize: 32 }} />,
      color: '#D4FF00',
    },
    {
      step: '02',
      title: 'Analyze Insights',
      description: 'Neural models process complex variables to generate precision-grade strategies.',
      icon: <Speed sx={{ fontSize: 32 }} />,
      color: '#10B981',
    },
    {
      step: '03',
      title: 'Market Action',
      description: 'Execute transactions on a global scale with real-time bidding and logistics.',
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      color: '#D4FF00',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
      {/* ─── DRIBBBLE STYLE HERO ─── */}
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          pt: { xs: 15, md: 0 },
          pb: { xs: 10, md: 0 }
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={7}>
              <FadeIn direction="up" distance={60}>
                <Chip 
                  label="The Future of Cultivation" 
                  sx={{ 
                    mb: 4, 
                    bgcolor: 'rgba(163, 230, 53, 0.1)', 
                    color: 'primary.main', 
                    fontWeight: 800, 
                    borderRadius: 2,
                    fontSize: '0.8rem',
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }} 
                />
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '3.5rem', sm: '5rem', lg: '7rem' }, 
                    mb: 3,
                    fontWeight: 900,
                    lineHeight: 1
                  }}
                >
                  Precision <Box component="span" sx={{ color: 'primary.main' }}>Farming</Box><br />
                  For A Sustainable <Box component="span" sx={{ color: 'secondary.main', fontStyle: 'italic' }}>Yield</Box>
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 6, 
                    maxWidth: 550, 
                    color: 'text.secondary',
                    fontWeight: 400,
                    fontSize: '1.25rem',
                    lineHeight: 1.6
                  }}
                >
                  Empowering the global food chain with state-of-the-art AI. From soil microbiology to global marketplace logistics.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <Button 
                    variant="contained" 
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/register')}
                  >
                    Start Cultivating
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/login')}
                  >
                    Partner Login
                  </Button>
                </Stack>
              </FadeIn>
            </Grid>
            <Grid item xs={12} md={5} sx={{ position: 'relative' }}>
              <ScaleIn delay={0.3}>
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                    background: 'url("https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                    border: '8px solid rgba(163, 230, 53, 0.05)',
                  }}
                />
              </ScaleIn>
            </Grid>
          </Grid>
        </Container>

        {/* CSS for Morphing Animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes morphing {
            0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
            33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
            66% { border-radius: 50% 50% 30% 70% / 50% 70% 30% 50%; }
            100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          }
        `}} />
      </Box>

      {/* ─── MODERN FEATURE GRID ─── */}
      <Box sx={{ py: 20, bgcolor: 'background.default' }}>
        <Container maxWidth="xl">
          <Grid container spacing={10} alignItems="center" sx={{ mb: 15 }}>
            <Grid item xs={12} md={6}>
              <FadeIn direction="right">
                <Typography variant="overline" sx={{ color: 'secondary.main' }}>Precision Tools</Typography>
                <Typography variant="h2" sx={{ mt: 2, mb: 4, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                  Engineering the<br />Future of Food
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.2rem', lineHeight: 1.8, maxWidth: 500 }}>
                  Our neural network analyzes soil chemistry, satellite imagery, and weather data to provide actionable intelligence for the modern agriculturist.
                </Typography>
              </FadeIn>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                {[
                  { title: 'Pathogen Analysis', color: '#EF4444' },
                  { title: 'Market Dynamics', color: '#3B82F6' },
                  { title: 'Nutrient Profiling', color: 'primary.main' },
                  { title: 'Crop Recommendation', color: 'secondary.main' }
                ].map((feat, i) => (
                  <Card key={i} sx={{ p: 4, textAlign: 'center', '&:hover': { borderColor: feat.color } }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: feat.color, mx: 'auto', mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{feat.title}</Typography>
                  </Card>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── DRIBBBLE CARD DECK (Simplified) ─── */}
      <Box sx={{ py: 20 }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <FadeIn direction="up">
              <Typography variant="h2" sx={{ mb: 2 }}>The Agri-Core Engine</Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>A unified ecosystem for the entire agricultural lifecycle</Typography>
            </FadeIn>
          </Box>

          <StaggerContainer staggerDelay={0.2}>
            <Grid container spacing={4} justifyContent="center">
              {howItWorks.map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box 
                    component={motion.div}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <Card 
                      sx={{ 
                        p: 4, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'visible'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: 6, 
                          bgcolor: `${item.color}15`, 
                          color: item.color,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mb: 4,
                          boxShadow: `0 20px 40px ${item.color}15`
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>{item.title}</Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        {item.description}
                      </Typography>
                    </Card>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </StaggerContainer>
        </Container>
      </Box>

      {/* ─── CTA FOOTER ─── */}
      <Box sx={{ py: 15, borderTop: '1px solid rgba(163, 230, 53, 0.1)' }}>
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              borderRadius: 12, 
              bgcolor: 'secondary.main', 
              color: 'black', 
              p: { xs: 6, md: 10 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <FadeIn direction="up">
              <Typography variant="h2" sx={{ color: 'black', mb: 3 }}>Scale Your Production</Typography>
              <Typography variant="h5" sx={{ color: 'black', opacity: 0.7, mb: 6, textTransform: 'none', maxWidth: 600, mx: 'auto' }}>
                Join the network of elite growers and sustainable sourcing collectives today.
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  bgcolor: 'black', 
                  color: 'secondary.main', 
                  px: 8, 
                  py: 2.5,
                  '&:hover': { bgcolor: '#222' }
                }}
                onClick={() => navigate('/register')}
              >
                Join the Network
              </Button>
            </FadeIn>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
