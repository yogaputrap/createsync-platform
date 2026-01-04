import React from 'react';
import { 
  Container, Typography, Button, Box, Grid, Stack, 
  useTheme, useMediaQuery, Avatar 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Definisi animasi keyframes untuk efek melayang (floating)
const floatAnimation = {
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
    '100%': { transform: 'translateY(0px)' },
  },
};

function WelcomePage() {
  const theme = useTheme();
  // Deteksi apakah layar ukuran mobile (md ke bawah)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        // Latar belakang gradien modern yang halus
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e3eeff 100%)',
        overflow: 'hidden',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center" direction={isMobile ? 'column-reverse' : 'row'}>
          
          {/* --- KOLOM KIRI: Teks & CTA --- */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* Badge kecil di atas judul */}
              <Box 
                sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  bgcolor: 'primary.light', color: 'primary.main', 
                  py: 0.5, px: 2, borderRadius: 4, width: 'fit-content',
                  mx: { xs: 'auto', md: 0 }
                }}
              >
                <AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" fontWeight="bold">
                  Platform Kolaborasi Generasi Baru
                </Typography>
              </Box>

              {/* Judul Utama yang Besar */}
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 900, 
                  lineHeight: 1.2,
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' } 
                }}
              >
                Bangun Proyek Impian <br />
                <Box component="span" sx={{ color: 'primary.main', position: 'relative' }}>
                  Secara Sinkron.
                  {/* Garis bawah dekoratif */}
                  <Box sx={{ 
                    position: 'absolute', bottom: 5, left: 0, width: '100%', height: '15px', 
                    bgcolor: 'primary.main', opacity: 0.2, zIndex: -1, borderRadius: 2 
                  }} />
                </Box>
              </Typography>
              
              {/* Deskripsi */}
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: '500px', mx: { xs: 'auto', md: 0 } }}>
                CreateSync mempertemukan kreator visioner dan developer andal di satu tempat. Kolaborasi real-time, tanpa hambatan.
              </Typography>

              {/* Tombol Aksi */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  component={RouterLink} 
                  to="/signup"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ 
                    py: 1.5, px: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: '0 8px 20px -5px rgba(25, 118, 210, 0.5)',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 25px -5px rgba(25, 118, 210, 0.6)' }
                  }}
                >
                  Mulai Gratis Sekarang
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  component={RouterLink} 
                  to="/signin"
                  sx={{ 
                    py: 1.5, px: 4, borderRadius: 3, fontSize: '1.1rem', fontWeight: 'bold',
                    textTransform: 'none', border: '2px solid',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-3px)', bgcolor: 'primary.50', border: '2px solid' }
                  }}
                >
                  Masuk Akun
                </Button>
              </Stack>

              {/* Social proof kecil */}
              <Stack direction="row" alignItems="center" spacing={1} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mt: 2 }}>
                <GroupsIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  Bergabung dengan <strong>1,000+</strong> kreator lainnya.
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* --- KOLOM KANAN: Ilustrasi Interaktif (Floating Visual) --- */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {/* Container Animasi Melayang */}
            <Box sx={{ ...floatAnimation, animation: 'float 6s ease-in-out infinite', position: 'relative', zIndex: 2 }}>
              {/* Lingkaran Latar Belakang Besar */}
              <Box sx={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: { xs: 300, md: 450 }, height: { xs: 300, md: 450 },
                background: 'radial-gradient(circle, rgba(25,118,210,0.2) 0%, rgba(255,255,255,0) 70%)',
                zIndex: -1, borderRadius: '50%'
              }} />
              
              {/* Ikon Roket Utama */}
              <RocketLaunchIcon 
                color="primary" 
                sx={{ 
                  fontSize: { xs: '180px', md: '280px' }, 
                  filter: 'drop-shadow(0 15px 25px rgba(25, 118, 210, 0.3))',
                  transform: 'rotate(-15deg)'
                }} 
              />

              {/* Elemen Dekoratif Melayang (Floating Bubbles) */}
              <Avatar sx={{ position: 'absolute', top: 0, right: 20, bgcolor: 'secondary.main', width: 50, height: 50, boxShadow: 3, ...floatAnimation, animation: 'float 8s ease-in-out infinite reverse' }}>
                <AutoAwesomeIcon />
              </Avatar>
               <Avatar sx={{ position: 'absolute', bottom: 40, left: -20, bgcolor: 'success.main', width: 40, height: 40, boxShadow: 3, ...floatAnimation, animation: 'float 7s ease-in-out infinite 1s' }}>
                <GroupsIcon fontSize="small" />
              </Avatar>
            </Box>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default WelcomePage;