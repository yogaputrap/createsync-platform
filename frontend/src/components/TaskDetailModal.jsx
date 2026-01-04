import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Kita perlu projectId

// Gaya CSS Sederhana untuk Modal
const modalStyles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    content: {
        position: 'relative', // Diubah dari 'absolute'
        backgroundColor: 'white', padding: '20px 40px',
        borderRadius: '8px', zIndex: 1001, width: '90%',
        maxWidth: '600px', // Lebar maksimum
        maxHeight: '90vh', // Tinggi maksimum
        overflowY: 'auto', // Aktifkan scroll jika konten panjang
    }
};

function TaskDetailModal({ task, onClose, onSave }) {
    const { projectId } = useParams(); // Ambil projectId dari URL
    const token = localStorage.getItem('token');

    // --- State untuk Form Detail ---
    const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });
    const [message, setMessage] = useState('');
    
    // --- State untuk File ---
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fileMessage, setFileMessage] = useState('');

    // --- Efek 1: Isi Form saat 'task' berubah ---
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                // Format tanggal untuk input <input type="date">
                deadline: task.deadline ? task.deadline.split('T')[0] : ''
            });
        }
    }, [task]);

    // --- Efek 2: Ambil File Lampiran saat 'task' berubah ---
    useEffect(() => {
        if (task) {
            const fetchAttachments = async () => {
                try {
                    const config = { headers: { 'x-auth-token': token } };
                    // Panggil API untuk mengambil file yang terikat ke tugas
                    const res = await axios.get(
                        `http://localhost:3001/api/tasks/${task.task_id}/files`,
                        config
                    );
                    setAttachments(res.data);
                } catch (err) {
                    setFileMessage('Gagal memuat lampiran');
                }
            };
            fetchAttachments();
        }
    }, [task, token]);

    // Jika tidak ada task, jangan render apa-apa
    if (!task) return null;

    // --- Handler: Perubahan Form ---
    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Handler: Simpan Detail (Judul, Deskripsi) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            // Panggil API untuk update detail tugas
            const res = await axios.put(
                `http://localhost:3001/api/tasks/${task.task_id}/details`,
                formData,
                config
            );
            onSave(res.data); // Update UI Kanban di parent
            onClose(); // Tutup modal
        } catch (err) {
            setMessage(err.response.data.msg || 'Gagal menyimpan');
        }
    };

    // --- Handler: Upload File Lampiran ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setFileMessage('Meminta izin upload...');

        try {
            // 1. Dapatkan Pre-Signed URL (API F4 yang ada)
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get(
                `http://localhost:3001/api/projects/${projectId}/upload-url?fileName=${file.name}&fileType=${file.type}`,
                config
            );
            const { uploadUrl, fileKey } = res.data;

            // 2. Upload ke S3
            setFileMessage('Mengunggah ke S3...');
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            // 3. Simpan Metadata ke DB (API F4 yang diperbarui)
            setFileMessage('Menyimpan metadata...');
            const metadataBody = {
                fileName: file.name,
                fileType: file.type,
                fileKey: fileKey,
                taskId: task.task_id // <-- Tautkan ke tugas ini
            };
            const metadataConfig = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            
            const newFileRes = await axios.post(
                `http://localhost:3001/api/projects/${projectId}/files`,
                metadataBody,
                metadataConfig
            );

            // 4. Tambahkan file ke daftar UI secara instan
            setAttachments([newFileRes.data, ...attachments]);
            setFileMessage('Upload berhasil!');
            
        } catch (err) {
            setFileMessage('Upload gagal');
        } finally {
            setUploading(false);
            // Reset input file
            event.target.value = null;
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                    &times;
                </button>
                <h2>Detail Tugas (L25)</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ margin: '15px 0' }}>
                        <label>Judul</label><br />
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={onChange}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div style={{ margin: '15px 0' }}>
                        <label>Deskripsi</label><br />
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={onChange}
                            style={{ width: '100%', minHeight: '100px', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ margin: '15px 0' }}>
                        <label>Deadline</label><br />
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={onChange}
                            style={{ padding: '8px' }}
                        />
                    </div>
                    
                    <button type="submit">Simpan Perubahan</button>
                    {message && <p style={{ color: 'red' }}>{message}</p>}
                </form>

                <hr style={{ margin: '20px 0' }} />

                {/* --- BAGIAN FILE LAMPIRAN --- */}
                <h3>File Lampiran</h3>
                <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                />
                {uploading && <p>{fileMessage}</p>}
                {!uploading && fileMessage && <p style={{ color: 'green' }}>{fileMessage}</p>}

                <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                    {attachments.map(file => (
                        <li key={file.file_id} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                {file.file_name}
                            </a>
                            <small> ({file.file_type})</small>
                        </li>
                    ))}
                    {attachments.length === 0 && !uploading && <p>Belum ada lampiran.</p>}
                </ul>

                {/* Di sini nanti kita tambahkan Checklist & Komentar */}
            </div>
        </div>
    );
}

export default TaskDetailModal;