import React, { useState } from 'react';
import {
    Container,
    Typography,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Box,
    Fade,
    Paper,
    InputAdornment,
    MenuItem,
    Chip,
    Stack,
    Divider,
    useTheme
} from '@mui/material';
import {
    Science,
    AutoAwesome,
    Thermostat,
    WaterDrop,
    Grass,
    CalendarMonth
} from '@mui/icons-material';
import api from '../services/api';

const SowingWindow = () => {
    const [formData, setFormData] = useState({
        crop: '', state: '', season: '',
        temperature: '', rainfall: '', soil_type: '', year: new Date().getFullYear()
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testIndex, setTestIndex] = useState(0);
    const theme = useTheme();

    const testSets = [
        { crop: 'Rice', state: 'Telangana', season: 'kharif', temperature: '23', rainfall: '180', soil_type: '', year: 2026 },
        { crop: 'Wheat', state: 'Punjab', season: 'rabi', temperature: '18', rainfall: '50', soil_type: 'Alluvial', year: 2026 },
        { crop: 'Cotton', state: 'Gujarat', season: 'kharif', temperature: '28', rainfall: '120', soil_type: 'Black', year: 2026 }
    ];

    const fillTestValues = () => {
        setFormData(testSets[testIndex]);
        setTestIndex((prev) => (prev + 1) % testSets.length);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const payload = {
                crop: formData.crop,
                state: formData.state,
                season: formData.season,
                year: parseInt(formData.year) || 2026,
            };
            if (formData.temperature) payload.temperature = parseFloat(formData.temperature);
            if (formData.rainfall) payload.rainfall = parseFloat(formData.rainfall);
            if (formData.soil_type) payload.soil_type = formData.soil_type;

            const response = await api.post('/sowing-window', payload);
            setResult(response.data);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : "Failed to get recommendation. Please check your inputs.");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ py: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Fade in={true} timeout={800}>
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 3 }}>
                                CHRONOS AGRI-AI
                            </Typography>
                            <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, mb: 2, color: 'text.primary' }}>
                                Sowing Window
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto' }}>
                                Find the optimal time to sow your crops based on regional data and seasons to maximize yield.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid item xs={12} md={5}>
                                <Card sx={{ borderRadius: 7, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.primary' }}>
                                            <CalendarMonth color="primary" /> Crop & Region
                                        </Typography>

                                    {error && (
                                        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#EF4444' }}>{error}</Typography>
                                        </Box>
                                    )}

                                        <form onSubmit={handleSubmit} style={{ display: 'block', width: '100%' }}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12}>
                                                    <TextField fullWidth label="Crop Name" name="crop" value={formData.crop} onChange={handleChange} required placeholder="e.g. Rice, Wheat, Maize" />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="State"
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="e.g. Punjab"
                                                        sx={{ minWidth: { xs: '100%', sm: 200 } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label="Season"
                                                        name="season"
                                                        value={formData.season}
                                                        onChange={handleChange}
                                                        required
                                                        sx={{ 
                                                            minWidth: { xs: '100%', sm: 200 },
                                                            '& .MuiSelect-select': { py: 1.5 } 
                                                        }}
                                                    >
                                                        <MenuItem value="kharif">Kharif</MenuItem>
                                                        <MenuItem value="rabi">Rabi</MenuItem>
                                                        <MenuItem value="summer">Summer</MenuItem>
                                                        <MenuItem value="whole year">Whole Year</MenuItem>
                                                    </TextField>
                                                </Grid>

                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="Temperature" name="temperature" value={formData.temperature} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Thermostat fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end">°C</InputAdornment> }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField fullWidth label="Rainfall" name="rainfall" value={formData.rainfall} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><WaterDrop fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end">mm</InputAdornment> }} />
                                                </Grid>
                                            </Grid>
                                            <Box sx={{ display: 'flex', mt: 5, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    onClick={fillTestValues}
                                                    sx={{ flex: 1, py: 2, borderRadius: 0, fontWeight: 700, border: 'none', borderRight: '1px solid', borderRightColor: 'divider', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', border: 'none', borderRight: '1px solid', borderRightColor: 'divider' } }}
                                                >
                                                    Test Values
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    disabled={loading}
                                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                                                    sx={{ flex: 1, py: 2, borderRadius: 0, fontWeight: 800 }}
                                                >
                                                    {loading ? 'Consulting...' : 'Generate Prediction'}
                                                </Button>
                                            </Box>
                                        </form>
                                </CardContent>
                            </Card>
                            </Grid>

                            <Grid item xs={12} md={7}>
                                {result ? (
                                    <Fade in={true}>
                                        <Box>
                                            <Card sx={{ borderRadius: 7, border: '1px solid', borderColor: 'primary.main', bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'background.paper', mb: 3 }}>
                                                <CardContent sx={{ p: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 2 }}>RECOMMENDED SOWING WINDOW</Typography>
                                                    <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>{result.sowing_week_start} - {result.sowing_week_end} Weeks</Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>{result.date_start} — {result.date_end}</Typography>
                                                    <Chip label={`Confidence: ${result.confidence}`} variant="outlined" color="primary" sx={{ fontWeight: 800 }} />
                                                </CardContent>
                                            </Card>

                                            {result.model_predictions && Object.keys(result.model_predictions).length > 0 && (
                                                <Box sx={{ mt: 4, p: 4, borderRadius: 7, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.primary', letterSpacing: 1.5 }}>
                                                        <Science color="primary" /> ENSEMBLE BREAKDOWN
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        {Object.entries(result.model_predictions).map(([name, pred]) => (
                                                            <Grid item xs={6} sm={4} key={name}>
                                                                <Box sx={{ p: 2, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 1, color: 'text.secondary', textTransform: 'uppercase' }}>{name}</Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>Wk {pred.toFixed(1)}</Typography>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            )}
                                        </Box>
                                    </Fade>
                                ) : (
                                    <Box sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed',
                                        borderColor: 'divider',
                                        borderRadius: 7,
                                        p: 6
                                    }}>
                                        <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2 }}>
                                            CHRONOS READY
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
};

export default SowingWindow;
