import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, 
  Button, Box, Alert, InputAdornment, IconButton,
  CssBaseline, Avatar, Stack, Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  PersonAddOutlined as RegisterIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SignUpPage() {
  const navigate = useNavigate();
  
  // 1. SINKRONISASI STATE: Gunakan 'fullName' (sesuai req.body di backend)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    if (message.text) setMessage({ text: '', type: '' });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { fullName, email, password } = formData;
    
    // Validasi Trim: Memastikan tidak hanya berisi spasi
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setMessage({ text: 'Harap isi semua kolom!', type: 'error' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({ text: 'Format email tidak valid!', type: 'error' });
      return false;
    }

    if (password.length < 6) {
      setMessage({ text: 'Kata sandi minimal 6 karakter!', type: 'error' });
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 2. SANITISASI DATA: Mengirim data yang sudah di-trim
      const submitData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      // Pastikan URL dan port sesuai dengan backend Anda
      const res = await axios.post('http://localhost:3001/api/auth/register', submitData);
      
      setMessage({ 
        text: res.data.msg || 'Akun berhasil dibuat! Mengalihkan...', 
        type: 'success' 
      });

      // 3. AUTO-LOGIN (Opsional): Jika backend mengirimkan token saat register
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setTimeout(() => navigate('/signin'), 2000);
      }

    } catch (err) {
      // 4. HANDLING ERROR: Menampilkan pesan spesifik dari backend
      const errorMsg = err.response?.data?.msg || 'Gagal tersambung ke server';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />

        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 4,
            border: '1px solid #e2e8f0'
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 45, height: 45 }}>
            <RegisterIcon />
          </Avatar>

          <Typography component="h1" variant="h5" fontWeight="800" sx={{ mt: 1 }}>
            Daftar Akun
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Bergabung dengan komunitas <b>CreateSync</b>
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="dense"
              required
              fullWidth
              id="fullName"
              label="Nama Lengkap"
              name="fullName" // Harus SAMA dengan kunci di state dan backend
              autoFocus
              value={formData.fullName}
              onChange={onChange}
              sx={{ mb: 1 }}
            />
            
            <TextField
              margin="dense"
              required
              fullWidth
              id="email"
              label="Alamat Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={onChange}
              sx={{ mb: 1 }}
            />

            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label="Kata Sandi (Min. 6 Karakter)"
              type={showPassword ? 'text' : 'password'}
              id="password"
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
                mt: 3, mb: 2, py: 1.2, 
                fontWeight: 'bold', textTransform: 'none', 
                borderRadius: 2, fontSize: '1rem' 
              }}
            >
              {loading ? 'Mendaftarkan...' : 'Buat Akun'}
            </Button>
            
            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.disabled">SUDAH PUNYA AKUN?</Typography>
            </Divider>

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="body2">Sudah jadi anggota?</Typography>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/signin')}
                sx={{ fontWeight: 'bold', textTransform: 'none' }}
              >
                Masuk Di Sini
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignUpPage;
