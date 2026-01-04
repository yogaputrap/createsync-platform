import React, { useState, useEffect } from 'react';
import axios from 'axios';

// (Gaya CSS Modal Sederhana)
const modalStyles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    content: {
        position: 'relative', backgroundColor: 'white', padding: '20px 40px',
        borderRadius: '8px', zIndex: 1001, width: '90%', maxWidth: '500px',
    }
};

function EditPortfolioDetailModal({ project, onSave, onClose }) {
    // State untuk textarea
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    // Isi textarea dengan deskripsi yang ada saat modal dibuka
    useEffect(() => {
        setDescription(project.contribution_desc || '');
    }, [project]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            // Siapkan body. Kita kirim deskripsi BARU dan status toggle LAMA
            const body = {
                isInPortfolio: project.is_in_portfolio,
                contributionDesc: description
            };

            // Panggil API yang sudah ada
            const res = await axios.put(
                `http://localhost:3001/api/profile/my-projects/${project.member_id}`,
                body,
                config
            );
            
            // Panggil 'onSave' dari parent untuk update UI
            onSave(res.data);
            onClose(); // Tutup modal

        } catch (err) {
            setMessage('Gagal menyimpan deskripsi');
        }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ float: 'right' }}>&times;</button>
                <h2>(L53) Edit Detail Proyek</h2>
                <h3>{project.project_name}</h3>
                
                <form onSubmit={handleSubmit}>
                    <label>Deskripsi Kontribusi Anda:</label><br />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ width: '100%', minHeight: '150px', marginTop: '10px' }}
                        placeholder="Jelaskan peran dan kontribusi Anda dalam proyek ini..."
                    />
                    <button type="submit" style={{ marginTop: '10px' }}>
                        Simpan Deskripsi
                    </button>
                    {message && <p>{message}</p>}
                </form>
            </div>
        </div>
    );
}

export default EditPortfolioDetailModal;