import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, 
  Button, Box, Alert, InputAdornment, IconButton,
  CssBaseline, Avatar, Divider, Stack
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon,
  ArrowBack as BackIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SignInPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  
  // UI State
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', formData);
      const token = res.data.token;
      
      setMessage({ text: 'Login berhasil! Mengalihkan...', type: 'success' });
      localStorage.setItem('token', token);

      setTimeout(() => {
        navigate('/home'); 
      }, 1000);

    } catch (err) {
      setMessage({ 
        text: err.response?.data?.msg || 'Terjadi kesalahan saat login', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        bgcolor: '#f1f5f9', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', // Tengah vertikal
        justifyContent: 'center' 
      }}
    >
      <Container component="main" maxWidth="xs">
        <CssBaseline />

        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 4,
            border: '1px solid #e2e8f0', // Border tipis sebagai pengganti shadow
            bgcolor: 'white'
          }}
        >
          {/* Ikon Lebih Kecil */}
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 45, height: 45 }}>
            <LockIcon />
          </Avatar>

          <Typography component="h1" variant="h5" fontWeight="800">
            Sign In
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selamat datang kembali di CreateSync
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="dense" // Lebih rapat
              required
              fullWidth
              id="email"
              label="Alamat Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={onChange}
            />
            <TextField
              margin="dense" // Lebih rapat
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={onChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 2, 
                mb: 2, 
                py: 1.2, 
                fontWeight: 'bold', 
                textTransform: 'none', 
                borderRadius: 2 
              }}
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
            
            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.disabled">ATAU</Typography>
            </Divider>

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Belum punya akun?
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/signup')}
                sx={{ fontWeight: 'bold', textTransform: 'none' }}
              >
                Daftar Gratis
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignInPage;