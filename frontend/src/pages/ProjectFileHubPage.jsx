import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Breadcrumbs, Link, Chip, Tooltip,
  CircularProgress, LinearProgress
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  InsertDriveFile as FileIcon, 
  PictureAsPdf as PdfIcon, 
  Image as ImageIcon, 
  DeleteOutline as DeleteIcon,
  Download as DownloadIcon,
  NavigateNext as NextIcon,
  Folder as FolderIcon
} from '@mui/icons-material';

function ProjectFileHubPage() {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3001/api/projects/${projectId}/files`, {
        headers: { 'x-auth-token': token }
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Gagal mengambil file');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Helper untuk Icon File berdasarkan ekstensi
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon color="secondary" />;
    if (ext === 'pdf') return <PdfIcon color="error" />;
    return <FileIcon color="primary" />;
  };

  return (
    <Box>
      {/* --- Header Section --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Breadcrumbs separator={<NextIcon fontSize="small" />} sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/home">Dashboard</Link>
            <Link underline="hover" color="inherit" component={RouterLink} to={`/projects/${projectId}`}>Project</Link>
            <Typography color="text.primary">File Hub</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">File Hub</Typography>
        </Box>
        
        <Box>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="upload-file"
            type="file"
            onChange={() => {/* Logika upload Anda di sini */}}
          />
          <label htmlFor="upload-file">
            <Button 
              variant="contained" 
              component="span" 
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Unggah File
            </Button>
          </label>
        </Box>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* --- Tabel Daftar File --- */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nama File</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tipe</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ukuran</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Diunggah Oleh</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Memuat file...</Typography>
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <FolderIcon sx={{ fontSize: 48, color: 'divider', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">Belum ada file di proyek ini.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.file_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getFileIcon(file.file_name)}
                      <Typography variant="body2" fontWeight={500}>{file.file_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={file.file_name.split('.').pop().toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell color="text.secondary">
                    {/* Logika konversi bytes ke MB */}
                    {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                  </TableCell>
                  <TableCell>{file.uploader_name || 'System'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Unduh">
                      <IconButton color="primary" size="small"><DownloadIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton color="error" size="small"><DeleteIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ProjectFileHubPage;