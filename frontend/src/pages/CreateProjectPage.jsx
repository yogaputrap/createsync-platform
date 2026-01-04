// Nama file: frontend/src/pages/CreateProjectPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  Stack, MenuItem, Alert, CircularProgress, Divider, Avatar
} from '@mui/material';
import { 
  RocketLaunch as RocketIcon, 
  ArrowBack as BackIcon,
  AddCircleOutline as CreateIcon 
} from '@mui/icons-material';

function CreateProjectPage() {
  const navigate = useNavigate();
  
  // State Utama
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Teknologi' // Default value
  });
  
  // State UI
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: '', type: '' });

  const { name, description, category } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: '', type: '' });

    const token = localStorage.getItem('token');
    if (!token) {
      setStatus({ text: 'Sesi berakhir, silakan login kembali.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const res = await axios.post('http://localhost:3001/api/projects', formData, config);

      setStatus({ text: 'Proyek berhasil dibuat! Mengalihkan...', type: 'success' });
      
      // Arahkan ke dashboard proyek baru atau home
      setTimeout(() => {
        navigate('/home'); 
      }, 1500);

    } catch (err) {
      setStatus({ 
        text: err.response?.data?.msg || 'Terjadi kesalahan saat membuat proyek.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {/* Tombol Kembali */}
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Kembali
      </Button>

      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        {/* Header Form */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              width: 56, height: 56, 
              mx: 'auto', mb: 2,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' 
            }}
          >
            <RocketIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">Luncurkan Proyek</Typography>
          <Typography variant="body2" color="text.secondary">
            Isi detail dasar untuk memulai kolaborasi tim Anda.
          </Typography>
        </Box>

        {status.text && (
          <Alert severity={status.type} sx={{ mb: 3, borderRadius: 2 }}>
            {status.text}
          </Alert>
        )}

        <form onSubmit={onSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nama Proyek"
              name="name"
              value={name}
              onChange={onChange}
              required
              placeholder="Contoh: Aplikasi CreateSync Web"
              variant="outlined"
            />

            <TextField
              fullWidth
              select
              label="Kategori"
              name="category"
              value={category}
              onChange={onChange}
            >
              <MenuItem value="Teknologi">Teknologi & Software</MenuItem>
              <MenuItem value="Desain">Desain & Kreatif</MenuItem>
              <MenuItem value="Bisnis">Bisnis & Marketing</MenuItem>
              <MenuItem value="Seni">Seni & Fotografi</MenuItem>
              <MenuItem value="Lainnya">Lainnya</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Deskripsi Proyek"
              name="description"
              value={description}
              onChange={onChange}
              multiline
              rows={4}
              placeholder="Jelaskan tujuan dan visi proyek Anda..."
            />

            <Divider sx={{ my: 1 }} />

            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              fullWidth
              disabled={loading || !name}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CreateIcon />}
              sx={{ 
                py: 1.5, 
                fontWeight: 'bold', 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {loading ? 'Memproses...' : 'Buat Proyek Sekarang'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default CreateProjectPage;