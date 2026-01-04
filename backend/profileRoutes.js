const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/authMiddleware');

/**
 * @route   GET /api/profile/me
 * @desc    (L55) Mengambil profil pengguna yang sedang login
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Ambil data profil dari tabel 'users'
        const profile = await pool.query(
            "SELECT user_id, full_name, email, headline, bio, skills, external_links, availability, location FROM users WHERE user_id = $1",
            [userId]
        );

        if (profile.rows.length === 0) {
            return res.status(404).json({ msg: 'Profil tidak ditemukan' });
        }
        
        res.json(profile.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/profile
 * @desc    (L55) Memperbarui profil pengguna [KODE LENGKAP & SUDAH DIPERBAIKI]
 * @access  Private
 */
router.put('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Gunakan 'full_name' (dengan garis bawah) agar cocok dengan frontend/DB
        const { full_name, headline, bio, skills, external_links, availability, location } = req.body;

        // --- VALIDASI SERVER-SIDE ---
        if (!full_name || !headline) {
            return res.status(400).json({ msg: 'Nama Lengkap dan Headline wajib diisi.' });
        }
        if (!skills || !Array.isArray(skills) || skills.length === 0 || (skills.length === 1 && skills[0] === '')) {
            return res.status(400).json({ msg: 'Skill wajib diisi (minimal satu).' });
        }
        // --- AKHIR VALIDASI ---

        // Konversi array 'skills' yang bersih
        const skillsArray = skills.filter(s => s && s.trim() !== ''); // Hapus skill kosong
        
        // Konversi objek 'external_links' ke string JSON untuk disimpan di DB
        const externalLinksJson = JSON.stringify(external_links || null);

        const updatedProfile = await pool.query(
            `UPDATE users 
             SET 
                full_name = $1, 
                headline = $2, 
                bio = $3, 
                skills = $4, 
                external_links = $5,
                availability = $6, 
                location = $7
             WHERE user_id = $8 
             RETURNING user_id, full_name, email, headline, bio, skills, external_links, availability, location`,
            [
                full_name,
                headline || null,
                bio || null,
                skillsArray,
                externalLinksJson,
                availability || 'Available',
                location || null,
                userId
            ]
        );

        res.json(updatedProfile.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/profile/user/:userId
 * @desc    (L14/L56) Mengambil profil publik [DIPERBARUI DENGAN PROYEK]
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let result = {};

        // 1. Ambil data profil publik
        const profileQuery = await pool.query(
            "SELECT full_name, headline, bio, skills, external_links, availability, location FROM users WHERE user_id = $1",
            [userId]
        );

        if (profileQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Profil tidak ditemukan' });
        }
        
        result.profile = profileQuery.rows[0];

        // 2. Ambil proyek yang dikurasi (L56)
        //    Cari proyek di mana pengguna adalah anggota DAN is_in_portfolio = TRUE
        const projectsQuery = await pool.query(
            `SELECT 
                p.project_id, 
                p.name as project_name,
                pm.contribution_desc
             FROM project_members pm
             JOIN projects p ON pm.project_id = p.project_id
             WHERE pm.user_id = $1 AND pm.is_in_portfolio = TRUE
             ORDER BY p.created_at DESC`,
            [userId]
        );
        
        result.projects = projectsQuery.rows;

        // 3. Kirim data gabungan (profil + proyek)
        res.json(result);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/profile/my-projects
 * @desc    (L52) Mengambil semua proyek pengguna untuk kurasi portofolio
 * @access  Private
 */
router.get('/my-projects', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Ambil semua proyek yang pengguna ikuti (JOIN dengan 'projects')
        const projects = await pool.query(
            `SELECT 
                p.project_id, 
                p.name as project_name,
                pm.member_id, 
                pm.is_in_portfolio, 
                pm.contribution_desc
             FROM project_members pm
             JOIN projects p ON pm.project_id = p.project_id
             WHERE pm.user_id = $1
             ORDER BY p.created_at DESC`,
            [userId]
        );
        
        res.json(projects.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/profile/my-projects/:memberId
 * @desc    (L53) Memperbarui detail kurasi (toggle & deskripsi)
 * @access  Private
 */
router.put('/my-projects/:memberId', auth, async (req, res) => {
    try {
        const { memberId } = req.params; // Ini adalah ID dari 'project_members'
        const userId = req.user.id;
        const { isInPortfolio, contributionDesc } = req.body;

        // 1. Validasi Keamanan: Pastikan pengguna mengubah entri miliknya sendiri
        const ownershipCheck = await pool.query(
            "SELECT * FROM project_members WHERE member_id = $1 AND user_id = $2",
            [memberId, userId]
        );
        if (ownershipCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }
        
        // 2. Update data
        const updatedEntry = await pool.query(
            `UPDATE project_members 
             SET is_in_portfolio = $1, contribution_desc = $2 
             WHERE member_id = $3
             RETURNING *`,
            [isInPortfolio, contributionDesc, memberId]
        );
        
        res.json(updatedEntry.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/profile/search
 * @desc    (L12/L13) Mencari talenta berdasarkan filter
 * @access  Public
 */
router.get('/search', async (req, res) => {
    try {
        const { skill, location, availability } = req.query;

        // 1. Siapkan Kueri SQL Dinamis
        let baseQuery = "SELECT user_id, full_name, headline, skills, location, availability FROM users WHERE 1=1";
        const whereClauses = [];
        const queryParams = [];

        // 2. Filter SKILL
        if (skill && skill.trim() !== '') {
            queryParams.push(skill.trim());
            whereClauses.push(`$${queryParams.length} = ANY(skills)`);
        }

        // 3. Filter LOKASI
        if (location && location.trim() !== '') {
            queryParams.push(`%${location.trim()}%`);
            whereClauses.push(`location ILIKE $${queryParams.length}`);
        }
        
        // 4. Filter KETERSEDIAAN
        if (availability && availability.trim() !== '') {
            queryParams.push(availability.trim());
            whereClauses.push(`availability = $${queryParams.length}`);
        }

        // 5. Gabungkan filter
        if (whereClauses.length > 0) {
            baseQuery += " AND " + whereClauses.join(" AND ");
        }

        // 6. Jalankan kueri
        const { rows } = await pool.query(baseQuery, queryParams);
        
        res.json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;