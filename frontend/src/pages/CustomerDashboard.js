import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow,
  Grid, Card, CardContent, IconButton, Stack, Chip, Divider, InputAdornment, Fade, useTheme, Dialog,
  DialogTitle, DialogContent, DialogActions, Rating, Alert, CircularProgress,
  LinearProgress, Avatar, Tooltip, Snackbar, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel
} from '@mui/material';
import {
  Add, ShoppingBag, Assignment, Search, Storefront,
  HealthAndSafety, Agriculture, AssignmentTurnedIn,
  CheckCircle, Verified, Payment, Receipt, Groups, ArrowForward, LocalShipping,
  Visibility, Delete, ShoppingCart, CreditCard, PhoneAndroid,
  Close, Star, Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';



const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [allLobbies, setAllLobbies] = useState([]);

  const [orders, setOrders] = useState([]);



  const [selectedLobby, setSelectedLobby] = useState(null);
  const [openProposalDialog, setOpenProposalDialog] = useState(false);
  const [proposalPrice, setProposalPrice] = useState('');

  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Request detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [requestDetail, setRequestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Lobby search
  const [lobbySearch, setLobbySearch] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Farmer Lobby Marketplace state ──
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [yourLobbyOpen, setYourLobbyOpen] = useState(false);
  const [yourLobbyListings, setYourLobbyListings] = useState([]);
  const [yourLobbyLoading, setYourLobbyLoading] = useState(false);

  // ── Buy/Order from lobby state ──
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyListing, setBuyListing] = useState(null);
  const [buyContribution, setBuyContribution] = useState(null);
  const [buyStep, setBuyStep] = useState('method'); // 'method' | 'details' | 'done'
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('upi');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);

  // ── Crop health detail dialog state ──
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [healthListing, setHealthListing] = useState(null);

  const [commodity, setCommodity] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const theme = useTheme();

  useEffect(() => {
    fetchRequests(); fetchActiveLobbies(); fetchOrders(); fetchMarketplaceListings();
  }, []);

  const fetchMarketplaceListings = async () => {
    try {
      const res = await api.get('/lobby/marketplace-listings');
      setMarketplaceListings(res.data);
    } catch (err) { }
  };



  const handleOpenYourLobby = async () => {
    setYourLobbyLoading(true);
    setYourLobbyOpen(true);
    try {
      const res = await api.get('/lobby/your-lobby');
      setYourLobbyListings(res.data);
    } catch (err) {
      setYourLobbyListings([]);
    }
    setYourLobbyLoading(false);
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/marketplace/requests/me');
      setRequests(res.data);
    } catch (err) { }
  };

  const fetchActiveLobbies = async () => {
    try {
      const res = await api.get('/lobby/active');
      setActiveLobbies(res.data);
      setAllLobbies(res.data);
    } catch (err) { }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/marketplace/orders/me');
      setOrders(res.data);
    } catch (err) { }
  };

  const handleViewRequestDetail = async (requestId) => {
    setDetailLoading(true);
    setDetailDialogOpen(true);
    try {
      const res = await api.get(`/marketplace/requests/${requestId}/offers`);
      setRequestDetail(res.data);
    } catch (err) {
      setRequestDetail(null);
    }
    setDetailLoading(false);
  };

  const handleLobbySearch = (searchTerm) => {
    setLobbySearch(searchTerm);
    if (!searchTerm.trim()) {
      setActiveLobbies(allLobbies);
    } else {
      setActiveLobbies(
        allLobbies.filter(l => l.commodity.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  };





  const handleSendProposal = async () => {
    try {
      await api.post('/marketplace/proposals', { lobby_id: selectedLobby.id, proposed_price: parseFloat(proposalPrice) });
      setOpenProposalDialog(false); fetchActiveLobbies(); setProposalPrice('');
    } catch (err) { }
  };

  const handleRateOrder = async () => {
    try {
      await api.post(`/marketplace/orders/${selectedOrder.id}/rate?rating=${rating}&feedback=${feedback}`);
      setOpenRateDialog(false); fetchRequests();
    } catch (err) { }
  };

  const handleCreateRequest = async () => {
    if (!commodity || !targetQuantity) return;
    try {
      const data = { commodity, target_quantity: parseFloat(targetQuantity) };
      if (targetPrice) data.target_price = parseFloat(targetPrice);
      await api.post('/marketplace/requests', data);
      setCommodity(''); setTargetQuantity(''); setTargetPrice('');
      fetchRequests();
      setSnackbar({ open: true, message: 'Sourcing request created! A lobby has been opened for farmers.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create request', severity: 'error' });
    }
  };

  const handleConfirmRequest = async (requestId) => {
    try {
      await api.post(`/marketplace/requests/${requestId}/confirm`);
      fetchRequests();
    } catch (err) { }
  };

  const handleDeleteRequest = async (requestId, commodity) => {
    try {
      await api.delete(`/marketplace/requests/${requestId}`);
      fetchRequests();
      setSnackbar({ open: true, message: `Request for ${commodity} deleted`, severity: 'info' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to delete request');
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleOpenBuy = (listing, contribution = null) => {
    setBuyListing(listing);
    setBuyContribution(contribution);
    setBuyPaymentMethod('upi');
    setBuyStep('method');
    setCardNumber(''); setCardExpiry(''); setCardCvv(''); setUpiId('');
    setBuyDialogOpen(true);
  };

  const handleBuyProceed = () => {
    setBuyStep('details');
  };

  const handleBuyConfirm = async () => {
    if (!buyListing) return;
    setBuyLoading(true);
    try {
      await api.post(`/lobby/${buyListing.id}/direct-buy`, {
        payment_method: buyPaymentMethod,
        contribution_id: buyContribution?.id || null
      });
      setBuyStep('done');
      fetchMarketplaceListings();
      fetchOrders();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Order failed');
      setSnackbar({ open: true, message, severity: 'error' });
    }
    setBuyLoading(false);
  };

  const handleBuyDone = () => {
    setBuyDialogOpen(false);
    setBuyStep('method');
    navigate('/customer/orders');
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getOrderContributions = (order) => order.proposal?.lobby?.contributions || [];

  const getDirectBuyContributionId = (order) => {
    const match = order.proposal?.notes?.match(/contribution #(\d+)/);
    return match ? Number(match[1]) : null;
  };

  const getOrderPricing = (order) => {
    const contributions = getOrderContributions(order);
    const contributionId = getDirectBuyContributionId(order);
    const selectedContributions = contributionId
      ? contributions.filter((contribution) => contribution.id === contributionId)
      : contributions;

    const quantity = selectedContributions.reduce((sum, contribution) => sum + Number(contribution.quantity || 0), 0);
    const total = selectedContributions.reduce(
      (sum, contribution) => sum + (Number(contribution.quantity || 0) * Number(contribution.price_bid || 0)),
      0
    );
    const pricePerKg = quantity > 0 ? total / quantity : 0;

    return {
      quantity,
      pricePerKg,
      total: total > 0 ? total : Number(order.total_amount || 0),
    };
  };

  return (
    <Box sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      <Container maxWidth="xl">
        <Fade in={true} timeout={800}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, textTransform: 'uppercase' }}>Sourcing Hub</Typography>
            <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>Create requests, browse lobbies, and manage your orders</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { title: 'Active Requests', value: requests.filter(r => r.status === 'pending').length, icon: <Assignment />, color: theme.palette.primary.main },
                { title: 'Market Lobbies', value: allLobbies.length, icon: <Agriculture />, color: '#7B1FA2' },
                { title: 'My Orders', value: orders.length, icon: <Receipt />, color: '#1976D2', onClick: () => navigate('/customer/orders') },
                { title: 'Deals Closed', value: requests.filter(r => r.status === 'completed').length, icon: <AssignmentTurnedIn />, color: '#2E7D32' },
              ].map((stat, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Card
                    sx={{ borderRadius: 0, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', cursor: stat.onClick ? 'pointer' : 'default', transition: 'all 0.2s', '&:hover': stat.onClick ? { transform: 'translateY(-2px)', borderColor: 'primary.main', boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(163, 230, 53, 0.1)' : '0 8px 24px rgba(0,0,0,0.05)' } : {} }}
                    onClick={stat.onClick}
                  >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                      <Box sx={{ p: 1.5, borderRadius: 0, background: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(101, 163, 13, 0.08)', color: stat.color, mb: 2, display: 'flex' }}>{stat.icon}</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{stat.title}</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>{stat.value}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 12 }}>

                {/* ── Section 1: Create Request ── */}
                <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Create Sourcing Request</Typography>
                  <Stack spacing={2}>
                    <TextField fullWidth label="Commodity" placeholder="e.g. Wheat, Rice, Tomato" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <TextField fullWidth label="Quantity (kg)" type="number" value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} />
                      </Grid>
                      <Grid size={6}>
                        <TextField fullWidth label="Max Price (optional)" type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                      </Grid>
                    </Grid>
                    <Button variant="contained" fullWidth size="large" sx={{ py: 1.5, borderRadius: 2 }} onClick={handleCreateRequest} startIcon={<Add />}>
                      Start Sourcing
                    </Button>
                  </Stack>
                </Paper>

                {/* ── Section 2: My Requests with Confirm ── */}
                <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 4, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ p: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.06)' : 'rgba(101, 163, 13, 0.04)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>My Requests</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, m: 3, mt: 0 }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.08)' : 'rgba(101, 163, 13, 0.08)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Commodity</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Lobby</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Details</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary' }}>Action</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Remove</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requests.map((req) => {
                          const lobbyStatus = req.lobby?.status;
                          const isReady = lobbyStatus === 'ready';
                          return (
                            <TableRow key={req.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{req.commodity}</TableCell>
                              <TableCell>{req.target_quantity} kg</TableCell>
                              <TableCell>
                                <Chip label={req.status.toUpperCase()} size="small" color={req.status === 'completed' ? 'success' : 'primary'} variant="outlined" sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell>
                                {req.lobby ? (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      label={lobbyStatus?.toUpperCase()}
                                      size="small"
                                      color={isReady ? 'success' : 'default'}
                                      sx={{ fontWeight: 700 }}
                                    />
                                    {req.lobby.current_quantity > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        {req.lobby.current_quantity}/{req.target_quantity} kg
                                      </Typography>
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View farmer offers">
                                  <IconButton size="small" color="primary" onClick={() => handleViewRequestDetail(req.id)}>
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  {req.status === 'completed' ? (
                                    <Button size="small" startIcon={<Star />} color="secondary" onClick={() => { setSelectedOrder({ id: req.id }); setOpenRateDialog(true); }}>Rate</Button>
                                  ) : isReady ? (
                                    <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleConfirmRequest(req.id)}>
                                      Confirm & Pay
                                    </Button>
                                  ) : null}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                {req.status === 'pending' && (
                                  <Tooltip title="Delete Request">
                                    <IconButton size="small" color="error" onClick={() => handleDeleteRequest(req.id, req.commodity)}>
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                  {requests.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>No requests yet. Create your first sourcing request above!</Alert>
                    </Box>
                  )}
                </Paper>

                {/* ── Orders Quick View ── */}
                {orders.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt color="primary" /> Recent Orders
                      </Typography>
                      <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/customer/orders')}>View All</Button>
                    </Stack>
                    <Stack spacing={1.5}>
                      {orders.slice(0, 3).map((order) => {
                        const pricing = getOrderPricing(order);
                        return (
                        <Paper key={order.id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ p: 1, borderRadius: 2, bgcolor: order.status === 'created' ? '#FF980015' : order.status === 'paid' ? '#2196F315' : '#2E7D3215', color: order.status === 'created' ? '#FF9800' : order.status === 'paid' ? '#2196F3' : '#2E7D32', display: 'flex' }}>
                                {order.status === 'created' ? <Payment fontSize="small" /> : order.status === 'shipped' ? <LocalShipping fontSize="small" /> : <CheckCircle fontSize="small" />}
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {order.proposal?.lobby?.commodity || `Order #${order.id}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {pricing.quantity > 0
                                    ? `${pricing.quantity} kg x ${formatCurrency(pricing.pricePerKg)}/kg = ${formatCurrency(pricing.total)}`
                                    : formatCurrency(pricing.total)}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={order.status.toUpperCase()} size="small" sx={{ fontWeight: 700, fontSize: '0.6rem' }} color={order.status === 'delivered' ? 'success' : order.status === 'paid' ? 'primary' : 'warning'} variant="outlined" />
                              {order.status === 'created' && (
                                <Button size="small" variant="contained" sx={{ borderRadius: 2, minWidth: 'auto', px: 1.5 }} onClick={() => navigate('/customer/orders')}>Pay</Button>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                        );
                      })}
                    </Stack>
                  </Paper>
                )}

                {/* ── Ready for Sourcing (existing lobbies) ── */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Ready for Sourcing</Typography>
                  <TextField
                    size="small"
                    placeholder="Search crops..."
                    value={lobbySearch}
                    onChange={(e) => handleLobbySearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>, sx: { borderRadius: 3, width: 200 } }}
                  />
                </Stack>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {activeLobbies.map((lobby) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={lobby.id}>
                      <Card sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{lobby.commodity}</Typography>
                            <Chip label={`${lobby.aggregate_health_score}% Qlty`} size="small" color="success" sx={{ fontWeight: 700 }} />
                          </Stack>
                          <Typography variant="h5" sx={{ fontWeight: 800, my: 2 }}>{lobby.current_quantity} kg</Typography>
                          <Stack direction="row" spacing={1}>
                            <Button variant="contained" fullWidth sx={{ borderRadius: 2 }} onClick={() => { setSelectedLobby(lobby); setOpenProposalDialog(true); }}>Make Offer</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* ── Farmer Lobby Marketplace ── */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Storefront color="primary" /> Lobby
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Groups />}
                    onClick={handleOpenYourLobby}
                  >
                    Your Lobby
                  </Button>
                </Stack>

                {/* ── Joined Farmers ── */}
                {(() => {
                  const allFarmers = [];
                  const seenIds = new Set();
                  marketplaceListings.forEach(listing => {
                    (listing.contributions || []).forEach(c => {
                      if (c.farmer && !seenIds.has(c.farmer.id)) {
                        seenIds.add(c.farmer.id);
                        allFarmers.push(c.farmer);
                      }
                    });
                  });
                  return allFarmers.length > 0 ? (
                    <Paper sx={{ p: 2.5, borderRadius: 4, mb: 3, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                        <Groups fontSize="small" color="primary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Farmers in Lobby ({allFarmers.length})</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {allFarmers.map((farmer) => (
                          <Chip
                            key={farmer.id}
                            icon={<Person />}
                            label={farmer.full_name}
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  ) : null;
                })()}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {(() => {
                    // Flatten: one card per contribution (per farmer) instead of per lobby
                    const farmerCards = [];
                    marketplaceListings.forEach((listing) => {
                      (listing.contributions || []).forEach((contribution) => {
                        farmerCards.push({ listing, contribution });
                      });
                    });
                    return farmerCards.map(({ listing, contribution }) => {
                      const farmer = contribution?.farmer;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={`${listing.id}-${contribution.id}`}>
                          <Card
                            sx={{ 
                              borderRadius: 2, 
                              border: '1px solid', 
                              borderColor: 'divider', 
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'background.paper', 
                              transition: 'all 0.3s ease', 
                              cursor: 'pointer', 
                              '&:hover': { 
                                transform: 'translateY(-2px)', 
                                borderColor: 'primary.main', 
                                boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.05)' 
                              } 
                            }}
                            onClick={() => { setHealthListing(listing); setHealthDialogOpen(true); }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{listing.commodity}</Typography>

                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                <Agriculture fontSize="small" sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {farmer?.full_name || 'Farmer'}
                                </Typography>
                                {farmer?.email && (
                                  <Typography variant="caption" color="text.disabled">&bull; {farmer.email}</Typography>
                                )}
                              </Stack>
                              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Available</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 900, color: 'text.primary' }}>{contribution.quantity} kg</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Price</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                    {contribution.price_bid > 0 ? `₹${contribution.price_bid}/unit` : '—'}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Button
                                variant="contained"
                                fullWidth
                                size="small"
                                startIcon={<ShoppingCart />}
                                sx={{ borderRadius: 2 }}
                                onClick={(e) => { e.stopPropagation(); handleOpenBuy(listing, contribution); }}
                              >
                                Buy / Order
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    });
                  })()}
                  {marketplaceListings.length === 0 && (
                    <Grid size={12}>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        No farmer listings in the lobby yet. Farmers can publish their crops from their dashboard.
                      </Alert>
                    </Grid>
                  )}
                </Grid>

              </Grid>


            </Grid>
          </Box>
        </Fade>
      </Container>




      {/* Rate Order Dialog */}
      <Dialog open={openRateDialog} onClose={() => setOpenRateDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Rate the Collective</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>How was your experience with this farmer collective?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><Rating size="large" value={rating} onChange={(e, v) => setRating(v)} /></Box>
          <TextField fullWidth label="Feedback (Optional)" multiline rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpenRateDialog(false)}>Skip</Button><Button variant="contained" onClick={handleRateOrder}>Submit Rating</Button></DialogActions>
      </Dialog>

      {/* Offer Price Dialog */}
      <Dialog open={openProposalDialog} onClose={() => setOpenProposalDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Finalize Price Offer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>Propose a deal for <strong>{selectedLobby?.current_quantity} kg</strong> of {selectedLobby?.commodity}.</Typography>
          <TextField fullWidth label="Your Offer Price" type="number" value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpenProposalDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleSendProposal}>Send Official Offer</Button></DialogActions>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Request Details
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : requestDetail ? (
            <Stack spacing={2.5}>
              {/* Request Info */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F8FAFC' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{requestDetail.commodity}</Typography>
                    <Typography variant="body2" color="text.secondary">Target: {requestDetail.target_quantity} kg</Typography>
                  </Box>
                  <Chip label={requestDetail.status?.toUpperCase()} size="small" color={requestDetail.status === 'completed' ? 'success' : 'primary'} sx={{ fontWeight: 700 }} />
                </Stack>
              </Paper>

              {/* Lobby Progress */}
              {requestDetail.lobby && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Lobby Progress</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((requestDetail.lobby.current_quantity / requestDetail.target_quantity) * 100, 100)}
                    color={requestDetail.lobby.current_quantity >= requestDetail.target_quantity ? 'success' : 'primary'}
                    sx={{ height: 8, borderRadius: 5, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {requestDetail.lobby.current_quantity} / {requestDetail.target_quantity} kg filled ({requestDetail.lobby.status?.toUpperCase()})
                  </Typography>
                </Box>
              )}

              {/* Farmer Contributions */}
              {requestDetail.lobby?.contributions?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups fontSize="small" /> Farmers ({requestDetail.lobby.contributions.length})
                  </Typography>
                  <Stack spacing={1}>
                    {requestDetail.lobby.contributions.map((c, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: ['#2E7D32', '#1565C0', '#7B1FA2', '#F57C00'][i % 4] }}>
                              {c.farmer?.full_name?.charAt(0) || 'F'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.farmer?.full_name || 'Farmer'}</Typography>
                              <Typography variant="caption" color="text.secondary">Contributing {c.quantity} kg</Typography>
                            </Box>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {c.price_bid > 0 ? `₹${c.price_bid}/kg` : 'Open bid'}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {requestDetail.lobby?.contributions?.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No farmers have joined this lobby yet. Waiting for contributors...</Alert>
              )}
            </Stack>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>Could not load request details.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Your Lobby Dialog ── */}
      <Dialog open={yourLobbyOpen} onClose={() => setYourLobbyOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Groups color="primary" />
            <span>Your Lobby</span>
          </Stack>
          <IconButton onClick={() => setYourLobbyOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Farmer listings matching your active sourcing requests:
          </Typography>
          {yourLobbyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : yourLobbyListings.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No matching listings found. Create a sourcing request to see personalised farmer listings here.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {yourLobbyListings.map((listing) => {
                const contribution = listing.contributions?.[0];
                const farmer = contribution?.farmer;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={listing.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{listing.commodity}</Typography>

                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <Agriculture fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {farmer?.full_name || 'Farmer'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={3}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Available</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{listing.current_quantity || listing.target_quantity} kg</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Price</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              {contribution?.price_bid > 0 ? `₹${contribution.price_bid}/unit` : '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setYourLobbyOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Buy / Order Dialog ── */}
      <Dialog open={buyDialogOpen} onClose={() => !buyLoading && setBuyDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        {buyStep === 'done' ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Order Placed!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your order for <strong>{buyListing?.commodity}</strong> has been placed successfully.
            </Typography>
            <Button variant="contained" onClick={handleBuyDone} sx={{ borderRadius: 2 }}>View My Orders</Button>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 3, bgcolor: 'primary.dark', color: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Buy / Order — {buyListing?.commodity}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {buyListing?.current_quantity || buyListing?.target_quantity} kg &bull; ₹{(buyListing?.contributions?.[0]?.price_bid || 0) * (buyListing?.current_quantity || buyListing?.target_quantity || 0)} total
              </Typography>
            </Box>
            <DialogContent sx={{ p: 3 }}>
              {buyStep === 'method' && (
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ fontWeight: 700, mb: 2 }}>Select Payment Method</FormLabel>
                  <RadioGroup value={buyPaymentMethod} onChange={(e) => setBuyPaymentMethod(e.target.value)}>
                    {[
                      { value: 'upi', label: 'UPI / Google Pay / PhonePe', icon: <PhoneAndroid />, desc: 'Instant transfer' },
                      { value: 'credit', label: 'Credit Card', icon: <CreditCard />, desc: 'Visa, Mastercard, RuPay' },
                      { value: 'debit', label: 'Debit Card', icon: <CreditCard />, desc: 'Visa, Mastercard, RuPay' },
                    ].map((m) => (
                      <Paper key={m.value} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 3, cursor: 'pointer', borderColor: buyPaymentMethod === m.value ? 'primary.main' : 'divider', bgcolor: buyPaymentMethod === m.value ? 'primary.main' + '08' : 'transparent', transition: 'all 0.2s' }} onClick={() => setBuyPaymentMethod(m.value)}>
                        <FormControlLabel value={m.value} control={<Radio size="small" />} label={<Stack direction="row" spacing={1.5} alignItems="center"><Box sx={{ color: buyPaymentMethod === m.value ? 'primary.main' : 'text.secondary' }}>{m.icon}</Box><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{m.label}</Typography><Typography variant="caption" color="text.secondary">{m.desc}</Typography></Box></Stack>} sx={{ m: 0, width: '100%' }} />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              {buyStep === 'details' && (['credit', 'debit'].includes(buyPaymentMethod) ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Enter Card Details</Typography>
                  <TextField fullWidth label="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" inputProps={{ maxLength: 19 }} />
                  <Stack direction="row" spacing={2}>
                    <TextField fullWidth label="Expiry (MM/YY)" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" />
                    <TextField fullWidth label="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" inputProps={{ maxLength: 4 }} type="password" />
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Enter UPI ID</Typography>
                  <TextField fullWidth label="UPI ID" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
                </Stack>
              ))}

            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={() => { if (buyStep === 'method') setBuyDialogOpen(false); else setBuyStep('method'); }} disabled={buyLoading}>Back</Button>
              {buyStep === 'method' && (
                <Button variant="contained" onClick={handleBuyProceed} sx={{ borderRadius: 2 }}>Continue</Button>
              )}
              {buyStep === 'details' && (
                <Button variant="contained" onClick={handleBuyConfirm} disabled={buyLoading} startIcon={buyLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />} sx={{ borderRadius: 2 }}>
                  {buyLoading ? 'Placing Order...' : 'Confirm Order'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Crop Health Tracker Dialog ── */}
      <Dialog open={healthDialogOpen} onClose={() => setHealthDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HealthAndSafety color="primary" />{healthListing?.commodity}</Box>
          <IconButton size="small" onClick={() => setHealthDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {healthListing && (
            <Stack spacing={2.5}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#F8FAFC' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{healthListing.commodity}</Typography>
                    <Typography variant="body2" color="text.secondary">{healthListing.current_quantity || healthListing.target_quantity} kg available</Typography>
                  </Box>
                  <Chip label={`${healthListing.aggregate_health_score}% Quality`} color={healthListing.aggregate_health_score >= 80 ? 'success' : healthListing.aggregate_health_score >= 50 ? 'warning' : 'error'} sx={{ fontWeight: 700 }} />
                </Stack>
              </Paper>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Crop Health Score</Typography>
                <LinearProgress variant="determinate" value={Math.min(healthListing.aggregate_health_score, 100)} color={healthListing.aggregate_health_score >= 80 ? 'success' : healthListing.aggregate_health_score >= 50 ? 'warning' : 'error'} sx={{ height: 12, borderRadius: 6, mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {healthListing.aggregate_health_score >= 80 ? 'Premium grade — excellent quality' : healthListing.aggregate_health_score >= 50 ? 'Standard grade — acceptable quality' : 'Below average — use with caution'}
                </Typography>
              </Box>
              {healthListing.contributions?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Farmer Details</Typography>
                  {healthListing.contributions.map((c, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: ['#2E7D32', '#1565C0', '#7B1FA2'][i % 3] }}>{c.farmer?.full_name?.charAt(0) || 'F'}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.farmer?.full_name || 'Farmer'}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.quantity} kg &bull; ₹{c.price_bid}/unit</Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              )}
              <Button variant="contained" fullWidth startIcon={<ShoppingCart />} sx={{ borderRadius: 2 }} onClick={() => { setHealthDialogOpen(false); handleOpenBuy(healthListing); }}>Buy / Order This Crop</Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDashboard;
