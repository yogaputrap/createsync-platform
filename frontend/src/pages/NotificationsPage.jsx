// Nama file: frontend/src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Avatar, Button, Stack, Divider, Alert, CircularProgress, 
  Container, IconButton 
} from '@mui/material';
import { 
  CheckCircleOutline as AcceptIcon, 
  HighlightOff as DeclineIcon,
  MailOutline as MailIcon,
  BusinessCenter as ProjectIcon,
  Person as PersonIcon
} from '@mui/icons-material';

function NotificationsPage() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const token = localStorage.getItem('token');

    // 1. Ambil undangan yang 'pending'
    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:3001/api/invitations/my-pending', config);
                setInvitations(res.data);
            } catch (err) {
                setMessage({ text: 'Gagal memuat undangan', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchInvites();
    }, [token]);

    // 2. Handler untuk merespons undangan
    const handleResponse = async (invitationId, action) => {
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = { action };

            await axios.put(
                `http://localhost:3001/api/invitations/${invitationId}/respond`,
                body,
                config
            );
            
            setInvitations(invitations.filter(inv => inv.invitation_id !== invitationId));
            setMessage({ 
                text: action === 'accept' ? 'Undangan diterima!' : 'Undangan ditolak.', 
                type: 'success' 
            });
            
        } catch (err) {
            setMessage({ text: `Gagal ${action} undangan`, type: 'error' });
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <MailIcon color="primary" sx={{ fontSize: 35 }} />
                <Box>
                    <Typography variant="h4" fontWeight="bold">Notifikasi</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kelola undangan kolaborasi yang masuk untuk Anda
                    </Typography>
                </Box>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ text: '', type: '' })}>
                    {message.text}
                </Alert>
            )}

            {invitations.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f9f9f9' }}>
                    <MailIcon sx={{ fontSize: 60, color: 'divider', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Tidak ada undangan baru</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {invitations.map(inv => (
                        <Card key={inv.invitation_id} elevation={2} sx={{ borderRadius: 3, borderLeft: '6px solid #1976d2' }}>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 50, height: 50 }}>
                                            <ProjectIcon />
                                        </Avatar>
                                    </Grid>
                                    <Grid item xs>
                                        <Typography variant="h6" fontWeight="bold">
                                            {inv.project_name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PersonIcon fontSize="inherit" color="action" />
                                                Dari: <strong>{inv.inviter_name}</strong>
                                            </Typography>
                                            <Typography variant="body2">
                                                Sebagai: <strong>{inv.role}</strong>
                                            </Typography>
                                        </Box>
                                        <Paper variant="outlined" sx={{ p: 1.5, mt: 2, bgcolor: '#fafafa', fontStyle: 'italic' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                "{inv.message || 'Tidak ada pesan lampiran.'}"
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm="auto">
                                        <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1}>
                                            <Button 
                                                variant="contained" 
                                                color="success" 
                                                startIcon={<AcceptIcon />}
                                                onClick={() => handleResponse(inv.invitation_id, 'accept')}
                                                fullWidth
                                            >
                                                Terima
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                color="error" 
                                                startIcon={<DeclineIcon />}
                                                onClick={() => handleResponse(inv.invitation_id, 'decline')}
                                                fullWidth
                                            >
                                                Tolak
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Container>
    );
}

export default NotificationsPage;