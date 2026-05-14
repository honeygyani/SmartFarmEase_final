import React, { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Paper, Box, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow,
  Grid, Card, CardContent, IconButton, Stack, Chip, Divider, InputAdornment, Fade, useTheme, Dialog,
  DialogTitle, DialogContent, DialogActions, LinearProgress, Alert, Tooltip,
  MenuItem, Snackbar
} from '@mui/material';
import {
  Add, Inventory, TrendingUp, Science, Groups, CheckCircle,
  Verified, Gavel, Delete, Grass, BugReport, ArrowForward, Storefront,
  Receipt, ExpandMore, ExpandLess
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';



const statusColor = {
  available: 'success',
  committed: 'warning',
  sold: 'default',
};

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [myLobbies, setMyLobbies] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [cropsInLobby, setCropsInLobby] = useState([]);
  const [peerContributions, setPeerContributions] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(false);
  const [peerLoading, setPeerLoading] = useState(false);
  const [priceEdits, setPriceEdits] = useState({});
  const [priceUpdating, setPriceUpdating] = useState({});



  const [openProposalsDialog, setOpenProposalsDialog] = useState(false);
  const [selectedLobbyProposals, setSelectedLobbyProposals] = useState([]);
  const [selectedLobby, setSelectedLobby] = useState(null);

  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [targetLobby, setTargetLobby] = useState(null);
  const [contributionQty, setContributionQty] = useState('');
  const [priceBid, setPriceBid] = useState('');

  // Inventory form state
  const [commodity, setCommodity] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();

  // ── Join Lobby (publish to marketplace) state ──
  const [publishLobbyDialog, setPublishLobbyDialog] = useState(false);
  const [publishItem, setPublishItem] = useState(null);
  const [publishQuality, setPublishQuality] = useState(100);

  useEffect(() => {
    fetchInventory(); fetchMyLobbies(); fetchActiveRequests();
    fetchCropsInLobby(); fetchFarmerOrders(); fetchPeerContributions();

    const peerRefresh = setInterval(fetchPeerContributions, 30000);
    return () => clearInterval(peerRefresh);
  }, []);

  const fetchInventory = async () => {
    try { const res = await api.get('/inventory/me'); setInventory(res.data); } catch (err) { }
  };

  const fetchMyLobbies = async () => {
    try { const res = await api.get('/lobby/my-lobbies'); setMyLobbies(res.data); } catch (err) { }
  };

  const fetchActiveRequests = async () => {
    try { const res = await api.get('/marketplace/requests/active'); setActiveRequests(res.data); } catch (err) { }
  };

  const fetchCropsInLobby = async () => {
    try { const res = await api.get('/lobby/my-contributions'); setCropsInLobby(res.data); } catch (err) { }
  };

  const fetchPeerContributions = async () => {
    setPeerLoading(true);
    try {
      const res = await api.get('/lobby/peer-contributions');
      setPeerContributions(res.data);
      setPriceEdits(prev => {
        const next = { ...prev };
        res.data.forEach((item) => {
          if (item.is_mine && next[item.id] === undefined) {
            next[item.id] = item.price_bid;
          }
        });
        return next;
      });
    } catch (err) { }
    setPeerLoading(false);
  };

  const fetchFarmerOrders = async () => {
    try { const res = await api.get('/marketplace/orders/farmer-active'); setFarmerOrders(res.data); } catch (err) { }
  };

  const handleRemoveFromLobby = async (contributionId, commodity) => {
    try {
      await api.delete(`/lobby/contribution/${contributionId}`);
      fetchCropsInLobby();
      fetchPeerContributions();
      setSnackbar({ open: true, message: `${commodity} removed from lobby`, severity: 'info' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to remove');
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleUpdateLobbyPrice = async (contributionId) => {
    const price = parseFloat(priceEdits[contributionId]);
    if (Number.isNaN(price) || price < 0) {
      setSnackbar({ open: true, message: 'Enter a valid price', severity: 'error' });
      return;
    }

    setPriceUpdating(prev => ({ ...prev, [contributionId]: true }));
    try {
      await api.patch(`/lobby/contribution/${contributionId}/price?price_bid=${price}`);
      fetchCropsInLobby();
      fetchPeerContributions();
      setSnackbar({ open: true, message: 'Lobby price updated', severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to update price');
      setSnackbar({ open: true, message, severity: 'error' });
    }
    setPriceUpdating(prev => ({ ...prev, [contributionId]: false }));
  };

  const handleTrackOrder = async (orderId, newStatus) => {
    try {
      await api.post(`/marketplace/orders/${orderId}/track?new_status=${newStatus}`);
      fetchFarmerOrders();
      setSnackbar({ open: true, message: `Order status updated to ${newStatus}`, severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to update status');
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!commodity || !quantity || !price) return;
    try {
      await api.post('/inventory/', {
        commodity,
        quantity: parseFloat(quantity),
        price_per_unit: parseFloat(price),
        unit
      });
      setCommodity(''); setQuantity(''); setPrice(''); setUnit('kg');
      fetchInventory();
      setSnackbar({ open: true, message: `${commodity} added to inventory!`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add item', severity: 'error' });
    }
  };

  const handleDeleteInventory = async (itemId, itemName) => {
    try {
      await api.delete(`/inventory/${itemId}`);
      fetchInventory();
      setSnackbar({ open: true, message: `${itemName} removed from inventory`, severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
    }
  };



  const handleJoinLobby = async () => {
    try {
      const price = priceBid ? parseFloat(priceBid) : 0;
      await api.post('/lobby/contributions', { lobby_id: targetLobby.id, quantity: parseFloat(contributionQty), price_bid: price });
      setOpenJoinDialog(false);
      setContributionQty('');
      setPriceBid('');
      fetchMyLobbies(); fetchActiveRequests(); fetchCropsInLobby(); fetchPeerContributions();
      setSnackbar({ open: true, message: 'Crop has been successfully added to the lobby', severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to join lobby');
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleViewProposals = async (lobby) => {
    try {
      const res = await api.get(`/marketplace/lobby/${lobby.id}/proposals`);
      setSelectedLobby(lobby); setSelectedLobbyProposals(res.data); setOpenProposalsDialog(true);
    } catch (err) { }
  };

  const handleVote = async (proposalId, agree) => {
    try {
      await api.post(`/marketplace/proposals/${proposalId}/vote?agree=${agree}`);
      const res = await api.get(`/marketplace/lobby/${selectedLobby.id}/proposals`);
      setSelectedLobbyProposals(res.data); fetchMyLobbies();
    } catch (err) { }
  };

  // ── Publish inventory item to the shared lobby marketplace ──
  const handleOpenPublishDialog = (item) => {
    setPublishItem(item);
    setPublishQuality(100);
    setPublishLobbyDialog(true);
  };

  const handlePublishToLobby = async () => {
    if (!publishItem) return;
    try {
      await api.post('/lobby/farmer-publish', {
        inventory_id: publishItem.id,
        quality_score: parseFloat(publishQuality) || 100,
      });
      setPublishLobbyDialog(false);
      fetchMyLobbies();
      fetchCropsInLobby();
      fetchPeerContributions();
      setSnackbar({ open: true, message: `${publishItem.commodity} published to the lobby marketplace!`, severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to publish to lobby');
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleVeto = async (proposalId) => {
    try {
      await api.post(`/marketplace/proposals/${proposalId}/veto`);
      const res = await api.get(`/marketplace/lobby/${selectedLobby.id}/proposals`);
      setSelectedLobbyProposals(res.data); fetchMyLobbies();
    } catch (err) { }
  };

  const peerContributionsByCommodity = peerContributions.reduce((groups, contribution) => {
    const commodity = contribution.commodity || 'Other';
    if (!groups[commodity]) groups[commodity] = [];
    groups[commodity].push(contribution);
    return groups;
  }, {});



  return (
    <Box sx={{ py: 4, backgroundColor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      <Container maxWidth="xl">
        <Fade in={true} timeout={800}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, textTransform: 'uppercase' }}>Farmer Command Center</Typography>
            <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>Manage your inventory, track orders, and access AI insights</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { title: 'Total Inventory', value: inventory.length, icon: <Inventory />, color: theme.palette.primary.main },
                { title: 'Active Orders', value: farmerOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length, icon: <Receipt />, color: '#7B1FA2' },
                { title: 'Market Opps', value: activeRequests.length, icon: <TrendingUp />, color: '#1976D2' },
                { title: 'Crops in Lobby', value: cropsInLobby.length, icon: <Storefront />, color: '#F57C00' },
              ].map((stat, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Card sx={{ borderRadius: 0, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
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
                {/* ── Inventory Management ── */}
                <Paper sx={{ p: 3, borderRadius: 0, mb: 4, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, textTransform: 'uppercase' }}>Manage Inventory</Typography>
                  <Box component="form" onSubmit={handleAddInventory}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField fullWidth size="small" label="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} required />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField fullWidth size="small" label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField fullWidth size="small" label="Price/Unit" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField fullWidth size="small" select label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                          {['kg', 'quintal', 'ton', 'litre', 'dozen', 'piece'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Button fullWidth variant="contained" type="submit" startIcon={<Add />} sx={{ borderRadius: 2, py: 1 }}>Add Item</Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {inventory.length > 0 && (
                    <Box sx={{ mt: 3, borderRadius: 0, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                      <Table>
                        <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Commodity</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Unit</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'text.primary' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inventory.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{item.commodity}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₹{item.price_per_unit}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>
                                <Chip
                                  label={(item.status || 'available').toUpperCase()}
                                  size="small"
                                  color={statusColor[item.status] || 'default'}
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => handleDeleteInventory(item.id, item.commodity)}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                  {inventory.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>No inventory items yet. Add your first commodity above!</Alert>
                  )}
                </Paper>

                {/* ── Sourcing Opportunities ── */}
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Sourcing Opportunities</Typography>
                <Grid container spacing={2} sx={{ mb: 6 }}>
                  {activeRequests.map((req) => (
                    <Grid size={12} key={req.id}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'background.paper',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.05)'
                        }
                      }}>
                        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'text.primary' }}>{req.commodity}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Needed: <strong style={{ color: theme.palette.primary.main }}>{req.target_quantity} kg</strong></Typography>
                          </Box>
                          <Button variant="contained" size="small" onClick={() => { setTargetLobby(req.lobby); setOpenJoinDialog(true); }}>Join Lobby</Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {activeRequests.length === 0 && (
                    <Grid size={12}><Alert severity="info" sx={{ borderRadius: 2 }}>No active sourcing requests at the moment.</Alert></Grid>
                  )}
                </Grid>

                {/* ── Crops in Lobby ── */}
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storefront color="primary" /> Crops in Lobby
                </Typography>
                <Stack spacing={2} sx={{ mb: 4 }}>
                  {cropsInLobby.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>No crops in the lobby. Join a sourcing opportunity to contribute your crops.</Alert>
                  )}
                  {cropsInLobby.map((crop) => (
                    <Card key={crop.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{crop.commodity}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">{crop.quantity} kg &bull; ₹{crop.price_bid}/unit</Typography>

                            <Chip label={String(crop.lobby_status).toUpperCase()} size="small" sx={{ fontWeight: 700, height: 18, fontSize: '0.6rem' }} />
                          </Stack>
                        </Box>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleRemoveFromLobby(crop.id, crop.commodity)}
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                {/* ── My Active Deals ── */}
                {/* Lobby Price Watch */}
                <Paper sx={{ p: 3, borderRadius: 0, mb: 4, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="primary" /> Lobby Price Watch
                    </Typography>
                    <Button size="small" variant="outlined" onClick={fetchPeerContributions} disabled={peerLoading}>
                      {peerLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Compare active farmer listings for your joined crops and adjust your own price.
                  </Typography>

                  {peerContributions.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>Join a lobby to view farmer pricing for the same crop.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {Object.entries(peerContributionsByCommodity).map(([commodity, contributions]) => (
                        <Box key={commodity} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ px: 2, py: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 230, 53, 0.08)' : 'rgba(101, 163, 13, 0.08)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>{commodity}</Typography>
                          </Box>
                          <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800 }}>Farmer</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Listed Qty</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Current Price / Unit</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>Update</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {contributions.map((contribution) => (
                                  <TableRow key={contribution.id} hover>
                                    <TableCell sx={{ fontWeight: contribution.is_mine ? 800 : 600 }}>
                                      {contribution.farmer_name}
                                      {contribution.is_mine && (
                                        <Chip label="YOU" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                                      )}
                                    </TableCell>
                                    <TableCell>{contribution.quantity} kg</TableCell>
                                    <TableCell>
                                      {contribution.is_mine ? (
                                        <TextField
                                          size="small"
                                          type="number"
                                          value={priceEdits[contribution.id] ?? contribution.price_bid}
                                          onChange={(e) => setPriceEdits(prev => ({ ...prev, [contribution.id]: e.target.value }))}
                                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                          sx={{ maxWidth: 150 }}
                                        />
                                      ) : (
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>₹{contribution.price_bid}/unit</Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      {contribution.is_mine ? (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={priceUpdating[contribution.id] || String(priceEdits[contribution.id] ?? contribution.price_bid) === String(contribution.price_bid)}
                                          onClick={() => handleUpdateLobbyPrice(contribution.id)}
                                        >
                                          {priceUpdating[contribution.id] ? 'Saving...' : 'Save'}
                                        </Button>
                                      ) : (
                                        <Chip label={String(contribution.lobby_status).toUpperCase()} size="small" sx={{ fontWeight: 700, fontSize: '0.6rem' }} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>My Active Deals</Typography>
                  <Button size="small" endIcon={expandedOrders ? <ExpandLess /> : <ExpandMore />} onClick={() => setExpandedOrders(p => !p)}>
                    {expandedOrders ? 'Hide Orders' : `Orders (${farmerOrders.length})`}
                  </Button>
                </Stack>
                <Stack spacing={2}>
                  {myLobbies.map((lobby) => (
                    <Card key={lobby.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{lobby.commodity}</Typography>
                            {lobby.leader_id === user?.id && <Tooltip title="You are the Leader"><Chip label="LEADER" size="small" color="warning" icon={<Gavel sx={{ fontSize: '0.8rem !important' }} />} sx={{ fontWeight: 900, height: 20, fontSize: '0.6rem' }} /></Tooltip>}
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip label={lobby.status.toUpperCase()} size="small" color={lobby.status === 'deal_pending' ? 'secondary' : 'default'} sx={{ fontWeight: 700 }} />

                          </Stack>
                        </Box>
                        <Button variant="outlined" onClick={() => handleViewProposals(lobby)}>Details</Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                {/* ── Farmer Active Orders (customer-placed) ── */}
                {expandedOrders && farmerOrders.length > 0 && (
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Customer Orders for Your Crops</Typography>
                    {farmerOrders.map((order) => {
                      const commodity = order.proposal?.lobby?.commodity || `Order #${order.id}`;
                      const nextStatusMap = { paid: 'packed', packed: 'dispatched', dispatched: 'shipped', shipped: 'delivered' };
                      const nextStatus = nextStatusMap[order.status];
                      const trackingColors = { paid: '#2196F3', packed: '#00BCD4', dispatched: '#FF5722', shipped: '#7B1FA2', delivered: '#2E7D32', created: '#FF9800' };
                      return (
                        <Card key={order.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{commodity}</Typography>
                                <Typography variant="body2" color="text.secondary">Order #{order.id} &bull; ₹{order.total_amount?.toLocaleString('en-IN')}</Typography>
                                <Chip
                                  label={order.status.toUpperCase()}
                                  size="small"
                                  sx={{ mt: 0.5, fontWeight: 700, bgcolor: `${trackingColors[order.status]}20`, color: trackingColors[order.status], fontSize: '0.65rem' }}
                                />
                              </Box>
                              {nextStatus && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  sx={{ borderRadius: 2, textTransform: 'capitalize' }}
                                  onClick={() => handleTrackOrder(order.id, nextStatus)}
                                >
                                  Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                                </Button>
                              )}
                              {order.status === 'delivered' && (
                                <Chip label="DELIVERED" color="success" size="small" icon={<CheckCircle />} sx={{ fontWeight: 700 }} />
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Grid>


            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Proposals Dialog with VOTING & VETO */}
      <Dialog open={openProposalsDialog} onClose={() => setOpenProposalsDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Proposal Management - {selectedLobby?.commodity}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedLobbyProposals.length === 0 && <Alert severity="info" sx={{ borderRadius: 2 }}>No proposals yet for this lobby.</Alert>}
          {selectedLobbyProposals.map((proposal) => {
            const hasVoted = proposal.votes?.some(v => v.farmer_id === user?.id);
            const isLeader = selectedLobby?.leader_id === user?.id;
            const agreeCount = proposal.votes?.filter(v => v.agree).length || 0;
            const totalMembers = 3;

            return (
              <Card key={proposal.id} variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, position: 'relative' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="overline">Offer Price</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{proposal.proposed_price}</Typography>
                  </Box>
                  <Chip label={proposal.status.toUpperCase()} color={proposal.status === 'vetoed' ? 'error' : 'primary'} size="small" sx={{ fontWeight: 700 }} />
                </Stack>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>Majority Consensus</Typography><Typography variant="body2">{agreeCount}/{totalMembers} Agreed</Typography></Stack>
                  <LinearProgress variant="determinate" value={(agreeCount / totalMembers) * 100} color="success" sx={{ height: 8, borderRadius: 5 }} />
                </Box>

                <Stack direction="row" spacing={2}>
                  {proposal.status === 'voting' && !hasVoted && (
                    <>
                      <Button fullWidth variant="contained" color="success" onClick={() => handleVote(proposal.id, true)}>Agree</Button>
                      <Button fullWidth variant="outlined" color="error" onClick={() => handleVote(proposal.id, false)}>Decline</Button>
                    </>
                  )}
                  {isLeader && proposal.status === 'voting' && (
                    <Button fullWidth variant="contained" color="error" startIcon={<Gavel />} onClick={() => handleVeto(proposal.id)}>Veto Proposal</Button>
                  )}
                </Stack>
                {hasVoted && proposal.status === 'voting' && <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>Vote Cast</Alert>}
              </Card>
            );
          })}
        </DialogContent>
      </Dialog>



      {/* Join Lobby Dialog */}
      <Dialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Join Collective</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Your Quantity" type="number" value={contributionQty} onChange={(e) => setContributionQty(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Your Price Bid" type="number" value={priceBid} onChange={(e) => setPriceBid(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/unit</InputAdornment> }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpenJoinDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleJoinLobby}>Confirm</Button></DialogActions>
      </Dialog>

      {/* ── Join Lobby (Publish to Marketplace) Dialog ── */}
      <Dialog open={publishLobbyDialog} onClose={() => setPublishLobbyDialog(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storefront color="primary" /> Join Lobby
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
            Publishing <strong>{publishItem?.commodity}</strong> ({publishItem?.quantity}&nbsp;{publishItem?.unit}&nbsp;&middot;&nbsp;&#8377;{publishItem?.price_per_unit}/unit) to the shared lobby marketplace.
          </Alert>
          <TextField
            fullWidth
            label="Crop Quality Score (0–100)"
            type="number"
            value={publishQuality}
            onChange={(e) => setPublishQuality(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            helperText="Rate the quality of your crop (100 = premium grade)"
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setPublishLobbyDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Storefront />} onClick={handlePublishToLobby}>Join Lobby</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FarmerDashboard;
