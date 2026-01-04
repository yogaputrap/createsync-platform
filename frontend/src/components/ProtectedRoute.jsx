import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        // Jika tidak ada token, arahkan ke halaman signin
        // 'replace' mengganti riwayat navigasi
        // 'state' menyimpan halaman terakhir yang ingin diakses
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    // Jika ada token, tampilkan halaman yang diminta
    return children;
}

export default ProtectedRoute;