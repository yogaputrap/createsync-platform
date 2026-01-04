const express = require('express');
const router = express.Router();
const pool = require('./db');
const auth = require('./middleware/authMiddleware');

/**
 * @route   GET /api/invitations/my-owned-projects
 * @desc    (L15) Mengambil proyek di mana pengguna adalah OWNER
 * @access  Private
 */
router.get('/my-owned-projects', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Ambil proyek di mana pengguna adalah 'Owner'
        const projects = await pool.query(
            `SELECT p.project_id, p.name 
             FROM projects p
             JOIN project_members pm ON p.project_id = pm.project_id
             WHERE pm.user_id = $1 AND pm.role = 'Owner'`,
            [userId]
        );
        
        res.json(projects.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/invitations
 * @desc    (L15) Mengirim undangan proyek baru [DIPERBARUI DENGAN ROLE]
 * @access  Private (Hanya Owner)
 */
router.post('/', auth, async (req, res) => {
    try {
        const inviterUserId = req.user.id;
        // 1. Ambil 'role' dari body
        const { projectId, inviteeUserId, message, role } = req.body;

        // Validasi role
        if (!role || (role !== 'Editor' && role !== 'Viewer')) {
            return res.status(400).json({ msg: 'Peran tidak valid' });
        }

        // 2. Validasi: Pastikan pengirim adalah Owner dari proyek
        const ownerCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'Owner'",
            [projectId, inviterUserId]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Hanya Owner yang bisa mengirim undangan' });
        }
        
        // 3. Validasi: Cek jika talenta sudah jadi anggota
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, inviteeUserId]
        );
        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Talenta ini sudah menjadi anggota proyek' });
        }

        // 4. Buat undangan (dengan 'role' baru)
        const newInvitation = await pool.query(
            `INSERT INTO project_invitations (project_id, inviter_user_id, invitee_user_id, message, role)
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [projectId, inviterUserId, inviteeUserId, message || null, role]
        );
        
        // (Di sini kita juga bisa mengirim notifikasi (L05) nanti)

        res.status(201).json(newInvitation.rows[0]);

    } catch (err) {
        // Tangani error 'unique_violation' (undangan pending duplikat)
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'Undangan tertunda untuk talenta ini ke proyek ini sudah ada' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/invitations/my-pending
 * @desc    (L05) Mengambil undangan 'pending' untuk pengguna
 * @access  Private
 */
router.get('/my-pending', auth, async (req, res) => {
    try {
        const userId = req.user.id; // Ini adalah 'invitee_user_id'

        // Ambil undangan di mana pengguna adalah 'invitee' dan status 'pending'
        // 'JOIN' untuk mendapatkan nama proyek dan nama pengundang
        const invitations = await pool.query(
            `SELECT 
                inv.invitation_id, inv.message, inv.role,
                p.name as project_name,
                u.full_name as inviter_name
             FROM project_invitations inv
             JOIN projects p ON inv.project_id = p.project_id
             JOIN users u ON inv.inviter_user_id = u.user_id
             WHERE inv.invitee_user_id = $1 AND inv.status = 'pending'
             ORDER BY inv.created_at DESC`,
            [userId]
        );
        
        res.json(invitations.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/invitations/:invitationId/respond
 * @desc    (L05) Menerima (Accept) atau Menolak (Decline) undangan
 * @access  Private
 */
router.put('/:invitationId/respond', auth, async (req, res) => {
    const { invitationId } = req.params;
    const { action } = req.body; // "accept" atau "decline"
    const userId = req.user.id; // Pengguna yang merespons
    
    // Mulai koneksi 'client' untuk Transaksi
    const client = await pool.connect();

    try {
        // 1. Dapatkan detail undangan & validasi
        const inviteQuery = await pool.query(
            "SELECT * FROM project_invitations WHERE invitation_id = $1 AND invitee_user_id = $2 AND status = 'pending'",
            [invitationId, userId]
        );

        if (inviteQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Undangan tidak ditemukan atau sudah ditanggapi' });
        }
        
        const invitation = inviteQuery.rows[0];

        // --- MULAI TRANSAKSI ---
        await client.query('BEGIN');

        if (action === 'accept') {
            // 2. Jika "Accept": Tambahkan pengguna ke 'project_members'
            await client.query(
                `INSERT INTO project_members (project_id, user_id, role)
                 VALUES ($1, $2, $3)`,
                [invitation.project_id, userId, invitation.role]
            );

            // 3. Update status undangan menjadi 'accepted'
            await client.query(
                "UPDATE project_invitations SET status = 'accepted' WHERE invitation_id = $1",
                [invitationId]
            );
            
        } else if (action === 'decline') {
            // 3. Jika "Decline": Update status undangan menjadi 'declined'
            await client.query(
                "UPDATE project_invitations SET status = 'declined' WHERE invitation_id = $1",
                [invitationId]
            );
        } else {
            return res.status(400).json({ msg: 'Aksi tidak valid' });
        }

        // 4. 'Commit' transaksi
        await client.query('COMMIT');
        
        res.json({ msg: `Undangan berhasil di-${action}!` });

    } catch (err) {
        // Jika terjadi error, 'rollback' semua perubahan
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        // Selalu 'release' client kembali ke pool
        client.release();
    }
});

module.exports = router;