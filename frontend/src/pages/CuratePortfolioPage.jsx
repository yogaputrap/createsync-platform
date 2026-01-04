// Nama file: frontend/src/pages/CuratePortfolioPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, Chip, Stack, Alert, CircularProgress,
  Tooltip, Switch
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility as ShowIcon, 
  VisibilityOff as HideIcon,
  AutoFixHigh as WorkshopIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Impor modal baru
import EditPortfolioDetailModal from '../components/EditPortfolioDetailModal';

function CuratePortfolioPage() {
    const navigate = useNavigate();
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: 'info' });
    const [selectedProject, setSelectedProject] = useState(null);
    const token = localStorage.getItem('token');

    // Ambil semua proyek pengguna
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:3001/api/profile/my-projects', config);
                setMyProjects(res.data);
            } catch (err) {
                setMessage({ text: 'Gagal memuat proyek', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [token]);

    // Handler untuk Toggle Portofolio (L52)
    const handleTogglePortfolio = async (project) => {
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = {
                isInPortfolio: !project.is_in_portfolio,
                contributionDesc: project.contribution_desc 
            };
            const res = await axios.put(
                `http://localhost:3001/api/profile/my-projects/${project.member_id}`,
                body,
                config
            );
            setMyProjects(myProjects.map(p => 
                p.member_id === project.member_id ? { ...p, ...res.data } : p
            ));
            setMessage({ 
                text: project.is_in_portfolio ? 'Proyek disembunyikan' : 'Proyek ditampilkan di profil', 
                type: 'success' 
            });
        } catch (err) {
            setMessage({ text: 'Gagal memperbarui status', type: 'error' });
        }
    };

    // Handler untuk menyimpan dari modal (L53)
    const handleSaveDescription = (updatedProject) => {
        setMyProjects(myProjects.map(p => 
            p.member_id === updatedProject.member_id ? updatedProject : p
        ));
        setSelectedProject(null);
        setMessage({ text: 'Deskripsi kontribusi berhasil diperbarui', type: 'success' });
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Halaman */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        Personal Workshop
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Pilih dan kurasi proyek terbaik Anda untuk ditampilkan di profil publik.
                    </Typography>
                </Box>
            </Stack>

            {message.text && (
                <Alert 
                    severity={message.type} 
                    sx={{ mb: 3 }} 
                    onClose={() => setMessage({ text: '', type: 'info' })}
                >
                    {message.text}
                </Alert>
            )}

            {/* Curation Tool Table (L52) */}
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6" fontWeight="bold">Curation Tool</Typography>
                </Box>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nama Proyek</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Status Profil</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Aksi Tampilkan</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Detail Kontribusi</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {myProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Anda belum memiliki proyek untuk dikurasi.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            myProjects.map((project) => (
                                <TableRow key={project.member_id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {project.project_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={project.is_in_portfolio ? "Ditampilkan" : "Disembunyikan"}
                                            color={project.is_in_portfolio ? "success" : "default"}
                                            size="small"
                                            icon={project.is_in_portfolio ? <ShowIcon fontSize="small" /> : <HideIcon fontSize="small" />}
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={project.is_in_portfolio ? "Sembunyikan dari Profil" : "Tampilkan di Profil"}>
                                            <Switch 
                                                checked={project.is_in_portfolio}
                                                onChange={() => handleTogglePortfolio(project)}
                                                color="primary"
                                            />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="flex-start" spacing={1}>
                                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontStyle: !project.contribution_desc ? 'italic' : 'normal' }}>
                                                {project.contribution_desc || 'Belum ada deskripsi kontribusi.'}
                                            </Typography>
                                            <Tooltip title="Edit Deskripsi & Media">
                                                <IconButton 
                                                    size="small" 
                                                    color="primary" 
                                                    onClick={() => setSelectedProject(project)}
                                                    sx={{ bgcolor: '#f0f7ff' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal Edit Detail (L53) */}
            {selectedProject && (
                <EditPortfolioDetailModal
                    project={selectedProject}
                    onSave={handleSaveDescription}
                    onClose={() => setSelectedProject(null)}
                />
            )}
        </Container>
    );
}

export default CuratePortfolioPage;