// Nama file: frontend/src/pages/ProjectMembersPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Breadcrumbs, Link, Chip, Avatar,
  TextField, Grid, Alert, CircularProgress, 
  MenuItem, Select, FormControl, InputLabel, Tooltip
} from '@mui/material';
import { 
  PersonAdd as InviteIcon, 
  ManageAccounts as RoleIcon,
  ArrowBack as BackIcon,
  NavigateNext as NextIcon,
  MailOutline as MailIcon
} from '@mui/icons-material';

function ProjectMembersPage() {
    const { projectId } = useParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(''); 
    
    // --- State Formulir ---
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Editor'); 
    const [formMessage, setFormMessage] = useState({ text: '', type: '' }); 

    const fetchMembers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Harap login terlebih dahulu');
            setLoading(false);
            return;
        }
        try {
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(`http://localhost:3001/api/projects/${projectId}/members`, config);
            setMembers(res.data);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Gagal memuat anggota');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [projectId]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setFormMessage({ text: '', type: '' });
        
        const token = localStorage.getItem('token');
        const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
        const body = JSON.stringify({ email: inviteEmail, role: inviteRole });

        try {
            const res = await axios.post(
                `http://localhost:3001/api/projects/${projectId}/members`,
                body,
                config
            );
            
            setMembers([...members, res.data]);
            setFormMessage({ text: 'Anggota berhasil diundang!', type: 'success' });
            setInviteEmail('');
            setInviteRole('Editor');

        } catch (err) {
            setFormMessage({ 
                text: err.response?.data?.msg || 'Terjadi kesalahan', 
                type: 'error' 
            });
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box>
            {/* --- Navigasi & Judul --- */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs separator={<NextIcon fontSize="small" />} sx={{ mb: 1 }}>
                    <Link underline="hover" color="inherit" component={RouterLink} to="/home">Dashboard</Link>
                    <Link underline="hover" color="inherit" component={RouterLink} to={`/projects/${projectId}`}>Project</Link>
                    <Typography color="text.primary">Anggota & Peran</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">Manajemen Tim</Typography>
            </Box>

            {message && <Alert severity="error" sx={{ mb: 3 }}>{message}</Alert>}

            <Grid container spacing={4}>
                {/* --- Sisi Kiri: Formulir Undang --- */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Undang Rekan Tim</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Tambahkan rekan kerja Anda dengan alamat email mereka.
                        </Typography>

                        {formMessage.text && (
                            <Alert severity={formMessage.type} sx={{ mb: 2 }}>
                                {formMessage.text}
                            </Alert>
                        )}

                        <form onSubmit={handleInvite}>
                            <TextField
                                fullWidth
                                label="Alamat Email"
                                variant="outlined"
                                size="small"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                sx={{ mb: 2 }}
                            />
                            
                            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                <InputLabel>Pilih Peran</InputLabel>
                                <Select
                                    value={inviteRole}
                                    label="Pilih Peran"
                                    onChange={(e) => setInviteRole(e.target.value)}
                                >
                                    <MenuItem value="Editor">Editor</MenuItem>
                                    <MenuItem value="Viewer">Viewer</MenuItem>
                                </Select>
                            </FormControl>

                            <Button 
                                type="submit"
                                fullWidth 
                                variant="contained" 
                                startIcon={<InviteIcon />}
                                disabled={!inviteEmail}
                                sx={{ py: 1, fontWeight: 'bold' }}
                            >
                                Undang Sekarang
                            </Button>
                        </form>
                    </Paper>
                </Grid>

                {/* --- Sisi Kanan: Daftar Anggota --- */}
                <Grid item xs={12} md={8}>
                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Anggota</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Peran</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.user_id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: member.role === 'Owner' ? 'primary.main' : 'secondary.main' }}>
                                                    {member.full_name ? member.full_name[0] : '?'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold">{member.full_name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={member.role} 
                                                size="small" 
                                                color={member.role === 'Owner' ? 'primary' : 'default'} 
                                                variant={member.role === 'Owner' ? 'filled' : 'outlined'}
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {member.role !== 'Owner' && (
                                                <Tooltip title="Ubah Peran">
                                                    <IconButton color="primary" size="small">
                                                        <RoleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Kirim Pesan">
                                                <IconButton size="small">
                                                    <MailIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
}

export default ProjectMembersPage;