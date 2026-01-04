import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, FormControl, InputLabel, 
  Select, Box, Typography, Avatar, Divider, Alert,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon,
  BusinessCenter as ProjectIcon 
} from '@mui/icons-material';

function InviteToProjectModal({ talent, onClose }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [role, setRole] = useState('Editor');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ text: '', type: '' });

  // 1. Ambil daftar proyek milik user (dimana user adalah owner/admin)
  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/api/projects/my-owned', {
          headers: { 'x-auth-token': token }
        });
        setProjects(res.data);
      } catch (err) {
        console.error('Gagal memuat proyek Anda');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchMyProjects();
  }, []);

  // 2. Handler Kirim Undangan
  const handleInvite = async () => {
    if (!selectedProjectId) {
      setStatus({ text: 'Silakan pilih proyek terlebih dahulu.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setStatus({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/projects/${selectedProjectId}/invite`, {
        talentId: talent.user_id,
        role: role,
        message: message
      }, {
        headers: { 'x-auth-token': token }
      });

      setStatus({ text: 'Undangan berhasil dikirim!', type: 'success' });
      // Tutup modal setelah delay singkat agar user sempat melihat pesan sukses
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setStatus({ 
        text: err.response?.data?.msg || 'Gagal mengirim undangan.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ProjectIcon color="primary" /> Undang ke Proyek
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Info Talenta Singkat */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>{talent.full_name[0]}</Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">{talent.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">{talent.headline}</Typography>
          </Box>
        </Box>

        {status.text && <Alert severity={status.type} sx={{ mb: 2 }}>{status.text}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Pilihan Proyek */}
          <FormControl fullWidth size="small">
            <InputLabel>Pilih Proyek Anda</InputLabel>
            <Select
              value={selectedProjectId}
              label="Pilih Proyek Anda"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects}
            >
              {loadingProjects ? (
                <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Memuat proyek...</MenuItem>
              ) : projects.length === 0 ? (
                <MenuItem disabled>Anda belum memiliki proyek aktif</MenuItem>
              ) : (
                projects.map((p) => (
                  <MenuItem key={p.project_id} value={p.project_id}>{p.name}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Pilihan Peran */}
          <FormControl fullWidth size="small">
            <InputLabel>Peran yang Ditawarkan</InputLabel>
            <Select
              value={role}
              label="Peran yang Ditawarkan"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="Editor">Editor (Bisa edit file & chat)</MenuItem>
              <MenuItem value="Viewer">Viewer (Hanya bisa melihat)</MenuItem>
            </Select>
          </FormControl>

          {/* Pesan Personal */}
          <TextField
            fullWidth
            label="Pesan Personal (Opsional)"
            multiline
            rows={3}
            placeholder="Hai, saya tertarik dengan profil Anda dan ingin mengajak berkolaborasi di proyek ini..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>Batal</Button>
        <Button 
          onClick={handleInvite} 
          variant="contained" 
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          disabled={submitting || loadingProjects}
          sx={{ fontWeight: 'bold', px: 3 }}
        >
          {submitting ? 'Mengirim...' : 'Kirim Undangan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InviteToProjectModal;