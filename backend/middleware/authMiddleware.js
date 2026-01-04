const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(req, res, next) {
    // 1. Dapatkan token dari header permintaan
    //    Di frontend, kita akan mengirim token di header 'x-auth-token'
    const token = req.header('x-auth-token');

    // 2. Cek jika tidak ada token
    if (!token) {
        return res.status(401).json({ msg: 'Tidak ada token, otorisasi ditolak' });
    }

    try {
        // 3. Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Jika valid, tambahkan data pengguna (dari payload) ke objek 'req'
        //    Ingat kita menyimpan { user: { id: ... } } di payload?
        req.user = decoded.user;

        // 5. Lanjutkan ke rute (endpoint) yang dituju
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token tidak valid' });
    }
}

module.exports = auth;