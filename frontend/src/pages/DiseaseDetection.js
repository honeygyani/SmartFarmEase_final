import React, { useState } from 'react';
import {
  Container, Typography, Box, Button, Grid, Card, CardContent,
  CircularProgress, Alert, Fade, Chip, Stack, Divider, LinearProgress, useTheme
} from '@mui/material';
import {
  CloudUpload, BugReport, Speed, AutoAwesome, CheckCircle,
  Error as ErrorIcon, Warning, Help
} from '@mui/icons-material';
import api from '../services/api';

const DiseaseDetection = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const theme = useTheme();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/ai/disease_severity', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : "Failed to get prediction. Please ensure the server is running.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityDetails = (level) => {
    switch (level) {
      case 'Healthy':
        return { color: 'success', icon: <CheckCircle sx={{ fontSize: 18 }} />, label: 'Healthy / Low' };
      case 'Medium':
        return { color: 'warning', icon: <Warning sx={{ fontSize: 18 }} />, label: 'Warning / Medium' };
      case 'Severe':
        return { color: 'error', icon: <ErrorIcon sx={{ fontSize: 18 }} />, label: 'Critical / High' };
      default:
        return { color: 'info', icon: <Help sx={{ fontSize: 18 }} />, label: 'Indeterminate' };
    }
  };

  return (
    <Box sx={{ py: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 3 }}>
            DIAGNOSTIC ENGINE
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, mb: 2, color: 'text.primary' }}>
            Disease Analysis
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Upload a high-resolution image of the affected crop leaf for real-time neural analysis.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 4, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
              <form onSubmit={handleSubmit}>
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.2)' : 'divider',
                    borderRadius: 4,
                    p: 4,
                    mb: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.02)' : 'rgba(0,0,0,0.01)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.05)' : 'rgba(0,0,0,0.02)',
                    }
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {preview ? (
                    <Box component="img" src={preview} sx={{ width: '100%', borderRadius: 3, maxHeight: 300, objectFit: 'contain' }} />
                  ) : (
                  <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CloudUpload sx={{ fontSize: 64, color: 'primary.main', opacity: 0.5, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>Upload Image</Typography>
                    <Typography variant="body2" color="text.secondary">PNG, JPG or JPEG up to 10MB</Typography>
                  </Box>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <BugReport />}
                  sx={{ py: 2, borderRadius: 3, fontWeight: 800 }}
                >
                  {loading ? 'Processing...' : 'Run Neural Analysis'}
                </Button>
              </form>

              {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            {result ? (
              <Fade in={true}>
                <Card sx={{ borderRadius: 7, border: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'background.paper', height: '100%' }}>
                  <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                    <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mb: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'primary.main' }}>Neural Result</Typography>
                    </Stack>

                    <Grid container spacing={4}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1.5 }}>
                            Primary Condition
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', wordBreak: 'break-word', mt: 1 }}>
                            {result.disease_name || result.disease}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 3, borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800 }}>Confidence</Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mt: 1 }}>
                            {Math.round(result.confidence * 100)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, mb: 4 }}>
                      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block' }}>
                        Severity: {getSeverityDetails(result.severity_level || result.severity).label}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(result.severity_index || 0.5) * 100}
                        sx={{ 
                          height: 12, 
                          borderRadius: 6, 
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getSeverityDetails(result.severity_level || result.severity).color + '.main'
                          }
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 4, borderColor: 'divider' }} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.primary' }}>
                      <Speed color="primary" /> Morphological Metrics
                    </Typography>

                    <Grid container spacing={2}>
                      {[
                        { label: 'Lesion Ratio', value: ((result.lesion_area_ratio || 0) * 100).toFixed(1) + '%', icon: <BugReport fontSize="small" /> },
                        { label: 'Color Score', value: (result.color_index || 0).toFixed(2), icon: <AutoAwesome fontSize="small" /> },
                        { label: 'Health Index', value: (1 - (result.severity_index || 0)).toFixed(2), icon: <CheckCircle fontSize="small" /> }
                      ].map((item, idx) => (
                        <Grid item xs={4} key={idx}>
                          <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{item.value}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>{item.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ mt: 5, p: 3, borderRadius: 4, bgcolor: 'primary.main', color: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>AGRI-AI RECOMMENDATION</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {result.severity_level === 'Healthy' || result.severity === 'Healthy'
                          ? 'Maintain current irrigation and monitoring protocols. No immediate intervention required.'
                          : 'Immediate bio-remediation recommended. Check the Fertilizer Prediction tool for specific soil-treatment protocols.'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 7 }}>
                <Typography sx={{ color: 'text.disabled', fontWeight: 800, letterSpacing: 2 }}>
                  AWAITING INPUT
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DiseaseDetection;
