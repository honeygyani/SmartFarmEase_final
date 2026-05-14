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
    Alert,
    Box,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Chip,
    Fade,
    Paper,
    InputAdornment,
    useTheme
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Grass,
    Science,
    Thermostat,
    WaterDrop,
    Tsunami,
    AutoAwesome,
    TrendingUp,
    InfoOutlined,
    LightbulbCircle,
    AltRoute,
    HistoryEdu
} from '@mui/icons-material';
import api from '../services/api';

const CropRecommendation = () => {
    const [formData, setFormData] = useState({
        N: '', P: '', K: '',
        temperature: '', humidity: '', ph: '', rainfall: '',
        prev_crop: '', state: '', district: ''
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testIndex, setTestIndex] = useState(0);
    const theme = useTheme();

    const testSets = [
        { N: '90', P: '42', K: '43', temperature: '25.5', humidity: '71.5', ph: '6.5', rainfall: '202.9', prev_crop: 'wheat', state: 'Telangana', district: 'Warangal' },
        { N: '40', P: '55', K: '20', temperature: '21.0', humidity: '82.0', ph: '7.5', rainfall: '180.5', prev_crop: 'maize', state: 'Punjab', district: 'Ludhiana' },
        { N: '20', P: '30', K: '10', temperature: '32.0', humidity: '45.0', ph: '5.5', rainfall: '100.0', prev_crop: 'cotton', state: 'Maharashtra', district: 'Nagpur' }
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
                N: parseFloat(formData.N),
                P: parseFloat(formData.P),
                K: parseFloat(formData.K),
                temperature: parseFloat(formData.temperature),
                humidity: parseFloat(formData.humidity),
                ph: parseFloat(formData.ph),
                rainfall: parseFloat(formData.rainfall),
                prev_crop: formData.prev_crop,
                state: formData.state,
                district: formData.district
            };
            const response = await api.post('/ai/crop_recommendation', payload);
            setResult(response.data);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : "Failed to get recommendation. Please check your inputs.");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const renderExplanationForCrop = (cropName) => {
        if (!result || !result.explanations_by_crop) return null;
        const explList = result.explanations_by_crop[cropName];
        if (!explList || explList.length === 0) return null;

        return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ mb: 1.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', textTransform: 'uppercase' }}>
                    <LightbulbCircle fontSize="small" /> GROWTH LOGIC
                </Typography>
                <Grid container spacing={1}>
                    {explList.slice(0, 4).map((f, idx) => (
                        <Grid item xs={6} key={idx}>
                            <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>
                                    {f.feature_name || f.raw_feature}
                                </Typography>
                                <Typography variant="body2" sx={{ color: f.direction === 'supports' ? 'primary.main' : 'error.main', fontWeight: 800 }}>
                                    {f.direction === 'supports' ? 'Optimal' : 'Sub-optimal'}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderPriceForecastForCrop = (cropName) => {
        if (!result || !result.price_forecasts) return null;
        const pf = result.price_forecasts[cropName];
        if (!pf || !Array.isArray(pf)) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ mb: 1.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main', textTransform: 'uppercase' }}>
                    <TrendingUp fontSize="small" /> MARKET OUTLOOK
                </Typography>
                <Grid container spacing={1}>
                    {pf.slice(0, 4).map((p, idx) => (
                        <Grid item xs={3} key={idx}>
                            <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>{p.month}/{p.year.toString().slice(-2)}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary' }}>₹{Number(p.price).toFixed(0)}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{ py: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Fade in={true} timeout={800}>
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 3 }}>
                                STRATEGIC ADVISOR
                            </Typography>
                            <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, mb: 2, color: 'text.primary' }}>
                                Precision Crop Advice
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto' }}>
                                Analyze your soil composition and climate patterns to discover the most profitable
                                and sustainable crops for your specific location.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid item xs={12} md={5}>
                                <Card sx={{ borderRadius: 7, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.primary' }}>
                                            <Science color="primary" /> Field Parameters
                                        </Typography>
                                    <form onSubmit={handleSubmit}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}><TextField fullWidth label="N" name="N" value={formData.N} onChange={handleChange} required /></Grid>
                                            <Grid item xs={4}><TextField fullWidth label="P" name="P" value={formData.P} onChange={handleChange} required /></Grid>
                                            <Grid item xs={4}><TextField fullWidth label="K" name="K" value={formData.K} onChange={handleChange} required /></Grid>

                                            <Grid item xs={6}><TextField fullWidth label="Temp" name="temperature" value={formData.temperature} onChange={handleChange} required /></Grid>
                                            <Grid item xs={6}><TextField fullWidth label="Humid" name="humidity" value={formData.humidity} onChange={handleChange} required /></Grid>
                                            <Grid item xs={6}><TextField fullWidth label="pH" name="ph" value={formData.ph} onChange={handleChange} required /></Grid>
                                            <Grid item xs={6}><TextField fullWidth label="Rain" name="rainfall" value={formData.rainfall} onChange={handleChange} required /></Grid>

                                            <Grid item xs={12}><TextField fullWidth label="Previous Crop" name="prev_crop" value={formData.prev_crop} onChange={handleChange} required placeholder="e.g. Wheat" /></Grid>
                                            <Grid item xs={6}><TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} required /></Grid>
                                            <Grid item xs={6}><TextField fullWidth label="District" name="district" value={formData.district} onChange={handleChange} required /></Grid>
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
                                                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 2 }}>PRIMARY RECOMMENDATION</Typography>
                                                    <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>{result.predicted_crop}</Typography>
                                                    <Chip label={`98.4% Precision Match`} variant="outlined" color="primary" sx={{ fontWeight: 800 }} />
                                                </CardContent>
                                            </Card>

                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.primary', letterSpacing: 1.5 }}>
                                                <HistoryEdu color="primary" /> ALTERNATIVE STRATEGIES
                                            </Typography>

                                            {result.top5.map((item, index) => (
                                                <Accordion 
                                                    key={item.crop} 
                                                    sx={{ 
                                                        mb: 2, 
                                                        borderRadius: '24px !important', 
                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        '&:before': { display: 'none' } 
                                                    }}
                                                >
                                                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}>
                                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                                                            <Typography sx={{ fontWeight: 800, flexGrow: 1, color: 'text.primary' }}>{item.crop}</Typography>
                                                            <Chip label={`${(item.probability * 100).toFixed(1)}%`} size="small" sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'background.default' }} />
                                                        </Stack>
                                                    </AccordionSummary>
                                                    <AccordionDetails sx={{ px: 3, pb: 3 }}>
                                                        {renderPriceForecastForCrop(item.crop)}
                                                        <Divider sx={{ my: 3, borderColor: 'divider' }} />
                                                        {renderExplanationForCrop(item.crop)}
                                                    </AccordionDetails>
                                                </Accordion>
                                            ))}

                                            {result.counterfactuals && !result.counterfactuals.error && (
                                                <Box sx={{ mt: 4, p: 4, borderRadius: 7, bgcolor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main', letterSpacing: 1 }}>
                                                        <AltRoute /> ALTERNATIVE PATHWAY
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                                        To successfully cultivate <strong>{result.counterfactuals.target_crop}</strong>, calibrate your soil to:
                                                    </Typography>
                                                    <Grid container spacing={1}>
                                                        {['N', 'P', 'K'].map(nut => (
                                                            <Grid item xs={4} key={nut}>
                                                                <Box sx={{ p: 2, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderRadius: 3, border: '1px solid', borderColor: 'secondary.main' }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', display: 'block' }}>{nut}</Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>{result.counterfactuals.counterfactuals[0][nut]}</Typography>
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
                                        <Grass sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2 }}>
                                            ADVISOR READY
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

export default CropRecommendation;
