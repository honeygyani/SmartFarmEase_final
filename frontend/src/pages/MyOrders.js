import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Paper, Box, Button, Grid, Card, CardContent, Stack, Chip, Divider,
  Fade, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Stepper, Step, StepLabel, StepConnector, Rating, TextField, Avatar, Tooltip, IconButton,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, LinearProgress, Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ShoppingBag, Payment, LocalShipping, CheckCircle, Cancel, Star, AccountBalanceWallet,
  CreditCard, PhoneAndroid, Agriculture, ArrowBack, Receipt, Groups, Person,
  AttachMoney, Verified
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

// Custom stepper connector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E0E0E0',
    borderRadius: 1,
  },
  '&.Mui-active .MuiStepConnector-line': {
    backgroundImage: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    backgroundImage: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
  },
}));

const orderSteps = ['Order Created', 'Payment Done', 'Packed', 'Dispatched', 'Shipped', 'Delivered'];
const statusToStep = { created: 0, paid: 1, packed: 2, dispatched: 3, shipped: 4, delivered: 5, cancelled: -1 };

const statusColors = {
  created: '#FF9800',
  paid: '#2196F3',
  packed: '#00BCD4',
  dispatched: '#FF5722',
  shipped: '#7B1FA2',
  delivered: '#2E7D32',
  cancelled: '#D32F2F',
};

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Payment dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Rating dialog
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Order detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/marketplace/orders/me');
      setOrders(res.data);
    } catch (err) { }
    setLoading(false);
  };

  const handleOpenPay = (order) => {
    setSelectedOrder(order);
    setPaymentMethod('upi');
    setPaymentSuccess(false);
    setPayDialogOpen(true);
  };

  const handlePay = async () => {
    if (!selectedOrder) return;
    setPaymentLoading(true);
    try {
      await api.post(`/marketplace/orders/${selectedOrder.id}/pay?payment_method=${paymentMethod}`);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPayDialogOpen(false);
        setPaymentSuccess(false);
        fetchOrders();
        setSnackbar({ open: true, message: 'Payment successful!', severity: 'success' });
      }, 1500);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Payment failed', severity: 'error' });
    }
    setPaymentLoading(false);
  };

  const handleOpenRate = (order) => {
    setSelectedOrder(order);
    setRating(order.rating || 5);
    setFeedback(order.feedback || '');
    setRateDialogOpen(true);
  };

  const handleRate = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/marketplace/orders/${selectedOrder.id}/rate?rating=${rating}&feedback=${feedback}`);
      setRateDialogOpen(false);
      fetchOrders();
      setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Rating failed', severity: 'error' });
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const getCommodity = (order) => order.proposal?.lobby?.commodity || 'N/A';

  // Extract the contribution_id from proposal notes if present (format: "contribution #ID")
  const getTargetContributionId = (order) => {
    const notes = order.proposal?.notes || '';
    const match = notes.match(/contribution #(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const getTargetContribution = (order) => {
    const cid = getTargetContributionId(order);
    const contributions = order.proposal?.lobby?.contributions || [];
    if (cid) {
      const found = contributions.find(c => c.id === cid);
      return found ? [found] : contributions;
    }
    return contributions;
  };

  const getQuantity = (order) => {
    const targeted = getTargetContribution(order);
    if (targeted.length > 0) {
      return targeted.reduce((sum, c) => sum + c.quantity, 0);
    }
    return order.proposal?.lobby?.current_quantity || 0;
  };

  const getFarmers = (order) => getTargetContribution(order);

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: <ShoppingBag />, color: theme.palette.primary.main },
    { title: 'Awaiting Payment', value: orders.filter(o => o.status === 'created').length, icon: <Payment />, color: '#FF9800' },
    { title: 'In Transit', value: orders.filter(o => ['packed', 'dispatched', 'shipped'].includes(o.status)).length, icon: <LocalShipping />, color: '#7B1FA2' },
    { title: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: <CheckCircle />, color: '#2E7D32' },
  ];

  return (
    <Box sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={800}>
          <Box>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
              <IconButton onClick={() => navigate('/customer-dashboard')} sx={{ bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>My Orders</Typography>
                <Typography variant="body2" color="text.secondary">Track payments, shipments & deliveries</Typography>
              </Box>
            </Stack>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                      <Box sx={{ p: 1.5, borderRadius: 3, background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`, color: stat.color, mr: 2, display: 'flex' }}>
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{stat.title}</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Orders List */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : orders.length === 0 ? (
              <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
                <ShoppingBag sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>No orders yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start by creating a sourcing request on the dashboard
                </Typography>
                <Button variant="contained" onClick={() => navigate('/customer-dashboard')}>Go to Dashboard</Button>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {orders.map((order) => {
                  const activeStep = statusToStep[order.status] ?? 0;
                  const isCancelled = order.status === 'cancelled';
                  const commodity = getCommodity(order);
                  const quantity = getQuantity(order);
                  const farmers = getFarmers(order);

                  return (
                    <Card key={order.id} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'visible', borderLeft: `4px solid ${statusColors[order.status]}` }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Top row */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
                          <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${statusColors[order.status]}15`, color: statusColors[order.status], display: 'flex' }}>
                                <Receipt />
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                  {commodity}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Order #{order.id} &bull; {quantity} kg &bull; {farmers.length} farmer{farmers.length !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 2, sm: 0 } }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ₹{order.total_amount?.toLocaleString('en-IN') || 0}
                            </Typography>
                            <Chip
                              label={order.status.toUpperCase()}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: `${statusColors[order.status]}15`,
                                color: statusColors[order.status],
                                border: `1px solid ${statusColors[order.status]}40`
                              }}
                            />
                          </Stack>
                        </Stack>

                        {/* Stepper */}
                        {!isCancelled && (
                          <Box sx={{ mb: 3 }}>
                            <Stepper activeStep={activeStep} connector={<ColorlibConnector />} alternativeLabel>
                              {orderSteps.map((label, index) => (
                                <Step key={label} completed={index <= activeStep}>
                                  <StepLabel
                                    StepIconProps={{
                                      sx: {
                                        color: index <= activeStep ? 'primary.main' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E0E0E0'),
                                        '&.Mui-completed': { color: 'primary.main' },
                                        '&.Mui-active': { color: 'primary.main' },
                                      }
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ fontWeight: index <= activeStep ? 700 : 400 }}>
                                      {label}
                                    </Typography>
                                  </StepLabel>
                                </Step>
                              ))}
                            </Stepper>
                          </Box>
                        )}

                        {isCancelled && (
                          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>This order was cancelled.</Alert>
                        )}

                        {/* Farmer avatars preview */}
                        {farmers.length > 0 && (
                          <Stack direction="row" spacing={-0.8} sx={{ mb: 2 }}>
                            {farmers.slice(0, 5).map((c, i) => (
                              <Tooltip key={i} title={`${c.farmer?.full_name || 'Farmer'} — ${c.quantity} kg`}>
                                <Avatar
                                  sx={{
                                    width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700,
                                    bgcolor: ['#2E7D32', '#1565C0', '#7B1FA2', '#F57C00', '#D32F2F'][i % 5],
                                    border: `2px solid ${theme.palette.background.paper}`
                                  }}
                                >
                                  {c.farmer?.full_name?.charAt(0) || 'F'}
                                </Avatar>
                              </Tooltip>
                            ))}
                            {farmers.length > 5 && (
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#9E9E9E', border: `2px solid ${theme.palette.background.paper}` }}>
                                +{farmers.length - 5}
                              </Avatar>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
                              Farmer Collective
                            </Typography>
                          </Stack>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* Action buttons */}
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={() => handleOpenDetail(order)} sx={{ borderRadius: 2 }}>
                            View Details
                          </Button>
                          {order.status === 'created' && (
                            <Button size="small" variant="contained" color="primary" startIcon={<Payment />} onClick={() => handleOpenPay(order)} sx={{ borderRadius: 2 }}>
                              Pay Now
                            </Button>
                          )}
                          {order.status === 'delivered' && !order.rating && (
                            <Button size="small" variant="contained" color="secondary" startIcon={<Star />} onClick={() => handleOpenRate(order)} sx={{ borderRadius: 2 }}>
                              Rate & Review
                            </Button>
                          )}
                          {order.rating && (
                            <Chip
                              icon={<Star sx={{ color: '#FFC107 !important' }} />}
                              label={`${order.rating}/5`}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Fade>
      </Container>

      {/* ── Payment Dialog ── */}
      <Dialog
        open={payDialogOpen}
        onClose={() => !paymentLoading && setPayDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {paymentSuccess ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Payment Successful!</Typography>
            <Typography variant="body2" color="text.secondary">Your order is being processed.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 3, bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Complete Payment</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Order #{selectedOrder?.id} &bull; {getCommodity(selectedOrder || {})}
              </Typography>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              {/* Order Summary */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>Order Summary</Typography>
                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Commodity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{getCommodity(selectedOrder || {})}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Quantity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{getQuantity(selectedOrder || {})} kg</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Farmers Involved</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{getFarmers(selectedOrder || {}).length}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{selectedOrder?.total_amount?.toLocaleString('en-IN') || 0}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* Payment Method */}
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1.5 }}>Payment Method</FormLabel>
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {[
                    { value: 'upi', label: 'UPI / Google Pay / PhonePe', icon: <PhoneAndroid />, desc: 'Instant transfer' },
                    { value: 'card', label: 'Debit / Credit Card', icon: <CreditCard />, desc: 'Visa, Mastercard, RuPay' },
                    { value: 'netbanking', label: 'Net Banking', icon: <AccountBalanceWallet />, desc: 'All major banks' },
                  ].map((method) => (
                    <Paper
                      key={method.value}
                      variant="outlined"
                      sx={{
                        p: 2, mb: 1.5, borderRadius: 3, cursor: 'pointer',
                        borderColor: paymentMethod === method.value ? 'primary.main' : 'divider',
                        bgcolor: paymentMethod === method.value ? 'primary.main' + '08' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <FormControlLabel
                        value={method.value}
                        control={<Radio size="small" />}
                        label={
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ color: paymentMethod === method.value ? 'primary.main' : 'text.secondary' }}>
                              {method.icon}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{method.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{method.desc}</Typography>
                            </Box>
                          </Stack>
                        }
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => setPayDialogOpen(false)} disabled={paymentLoading}>Cancel</Button>
              <Button
                variant="contained"
                size="large"
                onClick={handlePay}
                disabled={paymentLoading}
                startIcon={paymentLoading ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                sx={{ borderRadius: 2, px: 4 }}
              >
                {paymentLoading ? 'Processing...' : `Pay ₹${selectedOrder?.total_amount?.toLocaleString('en-IN') || 0}`}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Order Detail Dialog ── */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Order Details #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Stack spacing={3}>
              {/* Status Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={selectedOrder.status.toUpperCase()}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    py: 2.5,
                    px: 1,
                    bgcolor: `${statusColors[selectedOrder.status]}15`,
                    color: statusColors[selectedOrder.status],
                  }}
                />
              </Box>

              {/* Amount */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                <Typography variant="overline" color="text.secondary">Total Amount</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ₹{selectedOrder.total_amount?.toLocaleString('en-IN') || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCommodity(selectedOrder)} &bull; {getQuantity(selectedOrder)} kg
                </Typography>
              </Paper>

              {/* Farmers Breakdown */}
              {getFarmers(selectedOrder).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups fontSize="small" /> Farmer Contributions
                  </Typography>
                  <Stack spacing={1}>
                    {getFarmers(selectedOrder).map((c, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: ['#2E7D32', '#1565C0', '#7B1FA2', '#F57C00'][i % 4] }}>
                              {c.farmer?.full_name?.charAt(0) || 'F'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {c.farmer?.full_name || 'Farmer'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{c.quantity} kg contributed</Typography>
                            </Box>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            ₹{c.price_bid > 0 ? (c.price_bid * c.quantity).toLocaleString('en-IN') : '—'}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Rating if exists */}
              {selectedOrder.rating && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 253, 231, 0.05)' : '#FFFDE7' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating value={selectedOrder.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedOrder.rating}/5</Typography>
                  </Stack>
                  {selectedOrder.feedback && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      "{selectedOrder.feedback}"
                    </Typography>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedOrder?.status === 'created' && (
            <Button variant="contained" startIcon={<Payment />} onClick={() => { setDetailDialogOpen(false); handleOpenPay(selectedOrder); }}>
              Pay Now
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Rating Dialog ── */}
      <Dialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Rate Your Experience</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            How was your experience with the farmer collective for this order?
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Rating
              size="large"
              value={rating}
              onChange={(e, v) => setRating(v)}
              sx={{
                '& .MuiRating-iconFilled': { color: '#FFC107' },
                fontSize: '2.5rem'
              }}
            />
          </Box>
          <TextField
            fullWidth
            label="Your feedback (optional)"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us about the quality, delivery, communication..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRateDialogOpen(false)}>Skip</Button>
          <Button variant="contained" onClick={handleRate} startIcon={<Star />}>Submit Review</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyOrders;
