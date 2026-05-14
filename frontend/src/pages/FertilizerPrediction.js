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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Stack,
    Chip,
    Fade,
    Paper,
    InputAdornment,
    useTheme
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Science,
    Thermostat,
    WaterDrop,
    Opacity,
    Landscape,
    Agriculture,
    AutoAwesome,
    InfoOutlined,
    LightbulbCircle,
    MenuBook
} from '@mui/icons-material';
import api from '../services/api';

const FertilizerPrediction = () => {
    const [formData, setFormData] = useState({
        Temparature: '',
        'Humidity ': '', // Note the trailing space – must match model
        Moisture: '',
        'Soil Type': '',
        'Crop Type': '',
        Nitrogen: '',
        Potassium: '',
        Phosphorous: ''
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testIndex, setTestIndex] = useState(0);
    const theme = useTheme();

    const testSets = [
        { Temparature: '30', 'Humidity ': '65', Moisture: '40', 'Soil Type': 'Loamy', 'Crop Type': 'Cotton', Nitrogen: '35', Potassium: '45', Phosphorous: '55' },
        { Temparature: '25', 'Humidity ': '70', Moisture: '50', 'Soil Type': 'Clayey', 'Crop Type': 'Rice', Nitrogen: '40', Potassium: '30', Phosphorous: '60' },
        { Temparature: '35', 'Humidity ': '40', Moisture: '20', 'Soil Type': 'Sandy', 'Crop Type': 'Maize', Nitrogen: '20', Potassium: '50', Phosphorous: '40' }
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
                Temperature: parseFloat(formData.Temparature),
                Humidity: parseFloat(formData['Humidity ']),
                Moisture: parseFloat(formData.Moisture),
                'Soil Type': formData['Soil Type'],
                'Crop Type': formData['Crop Type'],
                Nitrogen: parseFloat(formData.Nitrogen),
                Potassium: parseFloat(formData.Potassium),
                Phosphorous: parseFloat(formData.Phosphorous)
            };
            const response = await api.post('/ai/fertilizer_prediction', payload);
            setResult(response.data);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : "Failed to get prediction. Please check your inputs.");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const friendlyFeatureName = (raw) => {
        if (!raw) return 'This condition';
        const lower = raw.toLowerCase();
        if (lower.includes('temparature')) return 'Temperature';
        if (lower.includes('humidity')) return 'Humidity';
        if (lower.includes('moisture')) return 'Soil moisture';
        if (lower.includes('nitrogen')) return 'Nitrogen level';
        if (lower.includes('potassium')) return 'Potassium level';
        if (lower.includes('phosphorous')) return 'Phosphorus level';
        if (lower.includes('soil') && lower.includes('type')) return 'Soil type';
        if (lower.includes('crop') && lower.includes('type')) return 'Crop type';
        return raw.replace(/.*__/, '').replace(/_/g, ' ');
    };

    const getExplanationForFertilizer = (fertName) => {
        if (!result || !result.explanations) return null;
        const match = result.explanations.find((ex) => ex.fertilizer === fertName);
        if (!match || !match.feature_contributions) return null;
        const entries = Object.entries(match.feature_contributions);
        if (entries.length === 0) return null;
        entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        return entries.slice(0, 4);
    };

    return (
        <Box sx={{ py: 8, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Fade in={true} timeout={800}>
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: 3 }}>
                                SOIL CHEMIST AI
                            </Typography>
                            <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, mb: 2, color: 'text.primary' }}>
                                Fertilizer Optimization
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto' }}>
                                Precision nutrient management for maximum yield. Input your soil test results
                                and current environmental conditions for a scientific recommendation.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid item xs={12} md={5}>
                                <Card sx={{ borderRadius: 7, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.primary' }}>
                                            <MenuBook color="primary" /> Soil Analysis
                                        </Typography>
                                        <form onSubmit={handleSubmit}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={4}><TextField fullWidth label="Nitrogen" name="Nitrogen" value={formData.Nitrogen} onChange={handleChange} required InputProps={{ endAdornment: <InputAdornment position="end">N</InputAdornment> }} /></Grid>
                                                <Grid item xs={4}><TextField fullWidth label="Phos" name="Phosphorous" value={formData.Phosphorous} onChange={handleChange} required InputProps={{ endAdornment: <InputAdornment position="end">P</InputAdornment> }} /></Grid>
                                                <Grid item xs={4}><TextField fullWidth label="Potas" name="Potassium" value={formData.Potassium} onChange={handleChange} required InputProps={{ endAdornment: <InputAdornment position="end">K</InputAdornment> }} /></Grid>

                                                <Grid item xs={6}><TextField fullWidth label="Temp" name="Temparature" value={formData.Temparature} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><Thermostat fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end">°C</InputAdornment> }} /></Grid>
                                                <Grid item xs={6}><TextField fullWidth label="Humid" name="Humidity " value={formData['Humidity ']} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><WaterDrop fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>
                                                <Grid item xs={12}><TextField fullWidth label="Moisture" name="Moisture" value={formData.Moisture} onChange={handleChange} required InputProps={{ startAdornment: <InputAdornment position="start"><Opacity fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>

                                                <Grid item xs={12}><TextField fullWidth label="Soil Type" name="Soil Type" value={formData['Soil Type']} onChange={handleChange} required placeholder="e.g. Sandy, Clay, Loamy" InputProps={{ startAdornment: <InputAdornment position="start"><Landscape fontSize="small" /></InputAdornment> }} /></Grid>
                                                <Grid item xs={12}><TextField fullWidth label="Current Crop" name="Crop Type" value={formData['Crop Type']} onChange={handleChange} required placeholder="e.g. Cotton, Maize" InputProps={{ startAdornment: <InputAdornment position="start"><Agriculture fontSize="small" /></InputAdornment> }} /></Grid>
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
                                                    {loading ? 'Analyzing...' : 'Generate Prediction'}
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
                                                    <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>{result.top3[0].fertilizer}</Typography>
                                                    <Chip label={`${Math.round(result.top3[0].prob * 100)}% Match`} variant="outlined" color="primary" sx={{ fontWeight: 800 }} />
                                                </CardContent>
                                            </Card>

                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.primary', letterSpacing: 1.5 }}>
                                                <InfoOutlined color="primary" /> ALTERNATIVE NUTRIENTS
                                            </Typography>

                                            {result.top3.map((item, index) => {
                                                const explanations = getExplanationForFertilizer(item.fertilizer);
                                                return (
                                                    <Accordion
                                                        key={item.fertilizer}
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
                                                                <Typography sx={{ fontWeight: 800, flexGrow: 1, color: 'text.primary' }}>{item.fertilizer}</Typography>
                                                                <Chip label={`${Math.round(item.prob * 100)}%`} size="small" sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'background.default' }} />
                                                            </Stack>
                                                        </AccordionSummary>
                                                        <AccordionDetails sx={{ px: 3, pb: 3 }}>
                                                            {explanations ? (
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ mb: 1.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', textTransform: 'uppercase' }}>
                                                                        <LightbulbCircle fontSize="small" /> Nutrient Logic
                                                                    </Typography>
                                                                    <Grid container spacing={1}>
                                                                        {explanations.map(([feat, value], idx) => (
                                                                            <Grid item xs={6} key={idx}>
                                                                                <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                                                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'text.secondary' }}>
                                                                                        {friendlyFeatureName(feat)}
                                                                                    </Typography>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: value >= 0 ? 'primary.main' : 'error.main' }}>
                                                                                        {value >= 0 ? 'Optimal Factor' : 'Counteracting'}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Grid>
                                                                        ))}
                                                                    </Grid>
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Detailed logic report unavailable.</Typography>
                                                            )}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                );
                                            })}
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
                                        <Science sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2 }}>
                                            SOIL LAB READY
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

export default FertilizerPrediction;
