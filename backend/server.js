// 1. Muat variabel dari file .env
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db'); // <-- Impor koneksi database kita
const bcrypt = require('bcryptjs'); // <-- Impor bcrypt
const jwt = require('jsonwebtoken'); // <-- Impor jsonwebtoken
const auth = require('./middleware/authMiddleware');
const http = require('http'); // <-- Impor modul http bawaan Node
const { Server } = require("socket.io"); // <-- Impor Server dari socket.io

const app = express();
const PORT = 3001;

const aws = require('aws-sdk');

app.use(cors());
app.use(bodyParser.json());

// --- KONFIGURASI SERVER UNTUK SOCKET.IO ---
// 1. Buat server HTTP dari aplikasi Express Anda
const server = http.createServer(app);

// 2. Inisialisasi Socket.IO dan lampirkan ke server HTTP
//    Kita juga perlu mengatur CORS untuk Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL frontend Vite Anda
        methods: ["GET", "POST"]
    }
});

// --- LOGIKA SOCKET.IO (F3) ---
io.on('connection', (socket) => {
    console.log(' seorang pengguna terhubung', socket.id);

    // 1. Saat klien (frontend) ingin bergabung ke ruangan
    socket.on('joinRoom', ({ projectId, token }) => {
        try {
            // (Kita akan memvalidasi token & keanggotaan di sini nanti)
            // Untuk saat ini, kita percaya pada klien
            
            socket.join(projectId); // Masukkan socket ke ruangan
            console.log(`Socket ${socket.id} bergabung ke ruangan ${projectId}`);
            
            // Beri tahu klien bahwa mereka berhasil bergabung
            socket.emit('joinedRoom', projectId); 

        } catch (err) {
            console.error('Gagal join room:', err);
            socket.emit('error', 'Gagal bergabung ke ruangan');
        }
    });

    // 2. Saat klien mengirim pesan baru [DIPERBARUI UNTUK THREAD]
    socket.on('sendMessage', async ({ projectId, content, token, parentMessageId }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.user.id;
            
            // Simpan pesan ke Database
            const newMsg = await pool.query(
                `INSERT INTO chat_messages (project_id, user_id, content, parent_message_id) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                // 'parentMessageId' akan menjadi NULL jika dikirim dari obrolan utama
                [projectId, userId, content, parentMessageId || null] 
            );

            // Ambil nama pengirim untuk dikirim ke klien
            const msgData = await pool.query(
                `SELECT cm.*, u.full_name as sender_name 
                 FROM chat_messages cm
                 JOIN users u ON cm.user_id = u.user_id
                 WHERE cm.message_id = $1`,
                [newMsg.rows[0].message_id]
            );

            const finalMessage = msgData.rows[0];

            // 3. Logika Pengiriman Pesan
            if (finalMessage.parent_message_id) {
                // Ini adalah balasan thread
                // Kirim ke "ruangan" thread spesifik (cth: 'thread-50')
                io.to(`thread-${finalMessage.parent_message_id}`).emit('receiveReply', finalMessage);
            } else {
                // Ini adalah pesan utama
                // Kirim ke ruangan proyek utama
                io.to(projectId).emit('receiveMessage', finalMessage);
            }

        } catch (err) {
            console.error('Error sendMessage:', err);
            socket.emit('error', 'Gagal mengirim pesan');
        }
    });

    // (BARU) Handler untuk bergabung/meninggalkan ruangan thread
    socket.on('joinThread', ({ messageId }) => {
        socket.join(`thread-${messageId}`);
        console.log(`Socket ${socket.id} bergabung ke thread ${messageId}`);
    });

    socket.on('leaveThread', ({ messageId }) => {
        socket.leave(`thread-${messageId}`);
        console.log(`Socket ${socket.id} meninggalkan thread ${messageId}`);
    });

    socket.on('disconnect', () => {
        console.log('pengguna terputus', socket.id);
    });
});

// --- KONFIGURASI AWS S3 ---
// Membaca kredensial dari file .env
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Buat instance S3
const s3 = new aws.S3();

// --- API ENDPOINTS ---

// --- RUTE AUTENTIKASI ---

/**
 * @route   POST /api/auth/register
 * @desc    (L03) Mendaftarkan pengguna baru (VERSI DATABASE)
 * @access  Public
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        // 1. Ambil data dari body
        const { email, password, fullName } = req.body;

        // 2. Validasi (tetap sama)
        if (!email || !password || !fullName) {
            return res.status(400).json({ msg: 'Harap isi semua field' });
        }

        // 3. Cek jika pengguna sudah ada DI DATABASE
        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'Email sudah terdaftar' });
        }

        // 4. Hash Password
        // Kita tidak pernah menyimpan password asli
        const salt = await bcrypt.genSalt(10); // Buat 'garam'
        const passwordHash = await bcrypt.hash(password, salt); // Hash passwordnya

        // 5. Simpan pengguna baru ke DATABASE
        const newUser = await pool.query(
            "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, email, full_name",
            [fullName, email, passwordHash]
        );
        
        console.log('Pengguna baru disimpan ke DB:', newUser.rows[0]);

        // 6. Kirim respons sukses
        // Di langkah berikutnya, kita akan membuat dan mengirim JWT di sini
        res.status(201).json({
            msg: 'Pendaftaran berhasil!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    (L02) Masuk (Sign In) pengguna dan kirim JWT
 * @access  Public
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        // 1. Ambil data dari body
        const { email, password } = req.body;

        // 2. Validasi
        if (!email || !password) {
            return res.status(400).json({ msg: 'Harap isi email dan password' });
        }

        // 3. Periksa email di database
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Email tidak ditemukan' });
        }

        // 4. Bandingkan (compare) password
        const isMatch = await bcrypt.compare(
            password,
            user.rows[0].password_hash // Password dari DB
        );

        if (!isMatch) {
            return res.status(400).json({ msg: 'Password salah' });
        }

        // 5. Buat JSON Web Token (JWT)
        // 'Payload' adalah data yang ingin kita simpan di dalam token
        const payload = {
            user: {
                id: user.rows[0].user_id // Hanya simpan ID pengguna di token
            }
        };

        // 6. Tanda tangani (sign) token dengan Secret Key kita
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Ambil secret key dari .env
            { expiresIn: '1h' }, // Token akan kedaluwarsa dalam 1 jam
            (err, token) => {
                if (err) throw err;
                // 7. Kirim token ke frontend
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- RUTE PROYEK ---

/**
 * @route   POST /api/projects
 * @desc    (L27) Membuat proyek baru [DIPERBARUI DENGAN TRANSAKSI]
 * @access  Private
 */
app.post('/api/projects', auth, async (req, res) => {
    // 1. Ambil koneksi 'client' dari 'pool'
    const client = await pool.connect();
    
    try {
        const { name, description, category } = req.body;
        const ownerId = req.user.id; 

        if (!name) {
            return res.status(400).json({ msg: 'Nama proyek wajib diisi' });
        }
        
        // --- MULAI TRANSAKSI ---
        await client.query('BEGIN');

        // 2. Operasi 1: Masukkan ke tabel 'projects'
        const projectInsertQuery = "INSERT INTO projects (owner_id, name, description, category) VALUES ($1, $2, $3, $4) RETURNING *";
        const newProject = await client.query(projectInsertQuery, [ownerId, name, description, category]);
        const createdProject = newProject.rows[0];

        // 3. Operasi 2: Masukkan 'Owner' ke tabel 'project_members'
        const memberInsertQuery = "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)";
        await client.query(memberInsertQuery, [createdProject.project_id, ownerId, 'Owner']);

        // 4. Jika semua sukses, 'commit' transaksi
        await client.query('COMMIT');
        
        // 5. Kirim kembali data proyek yang baru dibuat
        res.status(201).json(createdProject);

    } catch (err) {
        // 6. Jika ada error, 'rollback' (batalkan) semua perubahan
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        // 7. Selalu 'release' client kembali ke pool
        client.release();
    }
});

/**
 * @route   GET /api/projects
 * @desc    (L21) Mengambil semua proyek milik pengguna [DIPERBARUI]
 * (Sekarang mengambil semua proyek tempat pengguna terdaftar)
 * @access  Private
 */
app.get('/api/projects', auth, async (req, res) => {
    try {
        // 1. Dapatkan ID pengguna dari token
        const userId = req.user.id;

        // 2. Kueri SQL BARU:
        //    - 'JOIN' tabel 'projects' (p) dengan 'project_members' (pm)
        //    - Pilih proyek di mana 'user_id' di 'project_members' cocok
        //    - Kita juga mengambil 'role' pengguna dalam proyek tersebut
        const projects = await pool.query(
            `SELECT 
                p.*, 
                pm.role 
             FROM 
                projects p
             JOIN 
                project_members pm ON p.project_id = pm.project_id
             WHERE 
                pm.user_id = $1 
             ORDER BY 
                p.created_at DESC`,
            [userId]
        );

        // 3. Kirim kembali daftar proyek (bisa kosong)
        res.json(projects.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/:id
 * @desc    (L22) Mengambil data satu proyek spesifik [DIPERBAIKI]
 * @access  Private (Anggota Proyek)
 */
app.get('/api/projects/:id', auth, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // 1. Validasi Keamanan BARU:
        //    Cek jika pengguna ini adalah anggota proyek (bukan hanya owner)
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (memberCheck.rows.length === 0) {
            // Ini adalah pesan error yang lebih tepat
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota proyek)' });
        }

        // 2. Jika aman, ambil data proyek
        const project = await pool.query(
            "SELECT * FROM projects WHERE project_id = $1",
            [projectId]
        );

        // 3. Cek jika proyeknya sendiri ada
        if (project.rows.length === 0) {
            return res.status(404).json({ msg: 'Proyek tidak ditemukan' });
        }

        // 4. Kirim data proyek
        res.json(project.rows[0]);

    } catch (err) {
        console.error(err.message);
        // Tangani jika ID tidak valid (bukan angka)
        if (err.kind === 'ObjectId' || err.name === 'CastError') {
             return res.status(404).json({ msg: 'Proyek tidak ditemukan' });
        }
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/public-list
 * @desc    (L11) Mengambil daftar proyek terbuka (publik)
 * @access  Public
 */
app.get('/api/projects/public-list', async (req, res) => {
    try {
        const projects = await pool.query(
            `SELECT 
                p.project_id, p.name, p.description, p.category, 
                u.full_name as owner_name 
             FROM projects p
             JOIN users u ON p.owner_id = u.user_id
             ORDER BY p.created_at DESC
             LIMIT 20`,
            []
        );
        
        res.json(projects.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- RUTE TUGAS (TASK) (L23) ---

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    (L23) Membuat tugas baru untuk sebuah proyek [DIPERBAIKI]
 * @access  Private (Anggota Proyek)
 */
app.post('/api/projects/:projectId/tasks', auth, async (req, res) => {
    try {
        const { title } = req.body;
        const { projectId } = req.params;
        const userId = req.user.id;

        // 1. Validasi BARU: Cek jika pengguna adalah anggota
        //    (Di masa depan, kita bisa batasi ini hanya untuk Owner/Editor)
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota proyek)' });
        }
        
        // 2. Validasi input
        if (!title) {
            return res.status(400).json({ msg: 'Judul tugas wajib diisi' });
        }

        // 3. Buat tugas baru
        const newTask = await pool.query(
            "INSERT INTO tasks (project_id, title) VALUES ($1, $2) RETURNING *",
            [projectId, title]
        );
        
        res.status(201).json(newTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    (L23) Mengambil semua tugas untuk sebuah proyek [DIPERBAIKI]
 * @access  Private (Anggota Proyek)
 */
app.get('/api/projects/:projectId/tasks', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // 1. Validasi BARU: Cek jika pengguna adalah anggota
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota proyek)' });
        }

        // 2. Ambil semua tugas untuk proyek ini
        const tasks = await pool.query(
            "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC",
            [projectId]
        );
        
        res.json(tasks.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/:projectId/members
 * @desc    (L26) Mengambil daftar anggota & peran untuk sebuah proyek
 * @access  Private
 */
app.get('/api/projects/:projectId/members', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan: Cek jika pengguna yang meminta adalah anggota
        //    dari proyek ini.
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota)' });
        }

        // 2. Jika aman, ambil daftar semua anggota
        //    Kita 'JOIN' dengan tabel 'users' untuk mendapatkan nama & email
        const members = await pool.query(
            `SELECT 
                pm.role, 
                u.user_id, 
                u.full_name, 
                u.email 
             FROM project_members pm
             JOIN users u ON pm.user_id = u.user_id
             WHERE pm.project_id = $1`,
            [projectId]
        );
        
        res.json(members.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/projects/:projectId/members
 * @desc    (L26) Menambahkan anggota baru ke proyek
 * @access  Private (Hanya Owner)
 */
app.post('/api/projects/:projectId/members', auth, async (req, res) => {
    const { projectId } = req.params;
    const inviterUserId = req.user.id; // ID pengguna yang mengundang
    const { email, role } = req.body; // Email & peran anggota baru

    try {
        // 1. Validasi: Cek jika pengguna yang mengundang adalah 'Owner'
        const ownerCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'Owner'",
            [projectId, inviterUserId]
        );
        
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Hanya Owner yang bisa mengundang anggota' });
        }

        // 2. Validasi input
        if (!email || !role) {
            return res.status(400).json({ msg: 'Email dan peran wajib diisi' });
        }
        if (role === 'Owner') {
            return res.status(400).json({ msg: 'Tidak bisa menambahkan Owner baru saat ini' });
        }

        // 3. Cari pengguna yang akan diundang berdasarkan email
        const userToInvite = await pool.query(
            "SELECT user_id, full_name, email FROM users WHERE email = $1",
            [email]
        );

        if (userToInvite.rows.length === 0) {
            return res.status(404).json({ msg: 'Pengguna dengan email tersebut tidak ditemukan' });
        }
        
        const userToInviteId = userToInvite.rows[0].user_id;

        // 4. Tambahkan pengguna ke tabel project_members
        const newMember = await pool.query(
            "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *",
            [projectId, userToInviteId, role]
        );
        
        // 5. Kirim kembali data anggota baru (untuk diperlihatkan di frontend)
        //    Kita kombinasikan data dari tabel 'users' dan 'project_members'
        res.status(201).json({
            user_id: userToInvite.rows[0].user_id,
            full_name: userToInvite.rows[0].full_name,
            email: userToInvite.rows[0].email,
            role: newMember.rows[0].role
        });

    } catch (err) {
        // Tangani error jika pengguna sudah menjadi anggota (dari 'UNIQUE' constraint)
        if (err.code === '23505') { // '23505' adalah kode error 'unique_violation'
            return res.status(400).json({ msg: 'Pengguna ini sudah menjadi anggota proyek' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/tasks/:taskId/status
 * @desc    (L23) Memperbarui status tugas (untuk drag-and-drop)
 * @access  Private (Anggota Proyek)
 */
app.put('/api/tasks/:taskId/status', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body; // Status baru (cth: 'In Progress')
        const userId = req.user.id;

        // 1. Validasi status (sesuai skema DB)
        const validStatuses = ['To Do', 'In Progress', 'Review', 'Done'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Status tidak valid' });
        }

        // 2. Ambil project_id dari tugas
        const taskQuery = await pool.query("SELECT project_id FROM tasks WHERE task_id = $1", [taskId]);
        if (taskQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Tugas tidak ditemukan' });
        }
        const { project_id } = taskQuery.rows[0];

        // 3. Validasi Keamanan: Cek jika pengguna adalah anggota proyek
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [project_id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota proyek)' });
        }
        
        // 4. Update status tugas di database
        const updatedTask = await pool.query(
            "UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *",
            [status, taskId]
        );

        res.json(updatedTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/tasks/:taskId/details
 * @desc    (L25) Memperbarui detail tugas (judul, deskripsi, deadline)
 * @access  Private (Anggota Proyek)
 */
app.put('/api/tasks/:taskId/details', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        // 1. Ambil data baru dari body
        const { title, description, deadline } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ msg: 'Judul wajib diisi' });
        }

        // 2. Ambil project_id dari tugas untuk validasi keamanan
        const taskQuery = await pool.query("SELECT project_id FROM tasks WHERE task_id = $1", [taskId]);
        if (taskQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Tugas tidak ditemukan' });
        }
        const { project_id } = taskQuery.rows[0];

        // 3. Validasi Keamanan: Cek jika pengguna adalah anggota proyek
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [project_id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }
        
        // 4. Update tugas di database
        //    (deadline bisa jadi NULL jika dikosongkan)
        const updatedTask = await pool.query(
            `UPDATE tasks 
             SET title = $1, description = $2, deadline = $3 
             WHERE task_id = $4 
             RETURNING *`,
            [title, description || null, deadline || null, taskId]
        );

        res.json(updatedTask.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- RUTE FILE (F4) ---

/**
 * @route   GET /api/projects/:projectId/upload-url
 * @desc    (F4/L41) Mendapatkan pre-signed URL S3 untuk upload file
 * @access  Private (Anggota Proyek)
 */
app.get('/api/projects/:projectId/upload-url', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { fileName, fileType } = req.query; // Info file dari frontend
        const userId = req.user.id;

        // 1. Validasi Keamanan: Cek jika pengguna adalah anggota proyek
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota)' });
        }

        // 2. Buat 'Key' (nama file unik) untuk S3
        //    Ini akan mengatur file Anda di S3, cth:
        //    'projects/5/user_12/1678886400000-gambar-saya.jpg'
        const fileKey = `projects/${projectId}/user_${userId}/${Date.now()}-${fileName}`;

        // 3. Siapkan parameter untuk S3
        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Expires: 60, // URL hanya valid selama 60 detik
            ContentType: fileType,
        };

        // 4. Minta S3 untuk membuat URL 'putObject'
        const uploadUrl = s3.getSignedUrl('putObject', s3Params);
        
        // 5. Kirim URL dan Key kembali ke frontend
        res.json({
            uploadUrl: uploadUrl, // URL untuk frontend meng-upload file
            fileKey: fileKey      // Key untuk disimpan ke DB kita nanti
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/projects/:projectId/files
 * @desc    (F4/L42/L25) Menyimpan metadata file ke DB [DIPERBARUI & DIPERBAIKI]
 * @access  Private (Anggota Proyek)
 */
app.post('/api/projects/:projectId/files', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { fileName, fileType, fileKey, taskId } = req.body;
        const uploaderId = req.user.id;

        // --- INI BAGIAN YANG DIPERBAIKI ---
        // 1. Validasi Keamanan (Cek jika pengguna adalah anggota)
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, uploaderId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }
        // --- AKHIR PERBAIKAN ---

        // 2. Buat URL file S3
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        // 3. Simpan ke database
        const newFile = await pool.query(
            `INSERT INTO project_files 
             (project_id, uploader_id, file_name, file_type, file_key, file_url, task_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [projectId, uploaderId, fileName, fileType, fileKey, fileUrl, taskId || null]
        );
        
        res.status(201).json(newFile.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/:projectId/files
 * @desc    (F4/L42) Mengambil daftar semua file untuk sebuah proyek
 * @access  Private (Anggota Proyek)
 */
app.get('/api/projects/:projectId/files', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }

        // 2. Ambil file, 'JOIN' dengan nama uploader (sesuai L42)
        const files = await pool.query(
            `SELECT 
                pf.*, 
                u.full_name as uploader_name 
             FROM project_files pf
             JOIN users u ON pf.uploader_id = u.user_id
             WHERE pf.project_id = $1 
             ORDER BY pf.uploaded_at DESC`,
            [projectId]
        );

        res.json(files.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/tasks/:taskId/files
 * @desc    (L25) Mengambil semua file yang terlampir pada satu tugas
 * @access  Private (Anggota Proyek)
 */
app.get('/api/tasks/:taskId/files', auth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan (Cek jika pengguna adalah anggota proyek dari tugas ini)
        const taskQuery = await pool.query(
            `SELECT p.project_id 
             FROM tasks t
             JOIN projects p ON t.project_id = p.project_id
             WHERE t.task_id = $1`,
            [taskId]
        );
        if (taskQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Tugas tidak ditemukan' });
        }
        
        const { project_id } = taskQuery.rows[0];
        
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [project_id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }

        // 2. Ambil file yang cocok dengan task_id
        const files = await pool.query(
            "SELECT * FROM project_files WHERE task_id = $1 ORDER BY uploaded_at DESC",
            [taskId]
        );
        
        res.json(files.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/projects/:projectId/messages
 * @desc    (F3) Mengambil riwayat obrolan (HANYA PESAN UTAMA) [DIPERBARUI]
 * @access  Private (Anggota Proyek)
 */
app.get('/api/projects/:projectId/messages', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan (Cek jika pengguna adalah anggota)
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak (Bukan anggota proyek)' });
        }

        // 2. Ambil pesan (HANYA PESAN UTAMA)
        const messages = await pool.query(
            `SELECT 
                cm.*, 
                u.full_name as sender_name,
                -- (BARU) Hitung jumlah balasan
                (SELECT COUNT(*) FROM chat_messages 
                 WHERE parent_message_id = cm.message_id) as reply_count
             FROM chat_messages cm
             JOIN users u ON cm.user_id = u.user_id
             WHERE cm.project_id = $1 
               AND cm.parent_message_id IS NULL -- <-- HANYA PESAN UTAMA
             ORDER BY cm.sent_at ASC`,
            [projectId]
        );

        res.json(messages.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/messages/:messageId/replies
 * @desc    (L33) Mengambil semua balasan untuk satu pesan (thread)
 * @access  Private (Anggota Proyek)
 */
app.get('/api/messages/:messageId/replies', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan (Cek jika pengguna adalah anggota proyek dari pesan ini)
        const msgQuery = await pool.query(
            `SELECT p.project_id FROM chat_messages cm
             JOIN projects p ON cm.project_id = p.project_id
             WHERE cm.message_id = $1`,
            [messageId]
        );
        if (msgQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Pesan tidak ditemukan' });
        }
        
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [msgQuery.rows[0].project_id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }

        // 2. Ambil semua balasan untuk messageId ini
        const replies = await pool.query(
            `SELECT cm.*, u.full_name as sender_name 
             FROM chat_messages cm
             JOIN users u ON cm.user_id = u.user_id
             WHERE cm.parent_message_id = $1 
             ORDER BY cm.sent_at ASC`,
            [messageId]
        );

        res.json(replies.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/messages/:messageId/replies
 * @desc    (L33) Mengambil semua balasan untuk satu pesan (thread)
 * @access  Private (Anggota Proyek)
 */
app.get('/api/messages/:messageId/replies', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // 1. Validasi Keamanan (Cek jika pengguna adalah anggota proyek dari pesan ini)
        const msgQuery = await pool.query(
            `SELECT p.project_id FROM chat_messages cm
             JOIN projects p ON cm.project_id = p.project_id
             WHERE cm.message_id = $1`,
            [messageId]
        );
        if (msgQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Pesan tidak ditemukan' });
        }
        
        const memberCheck = await pool.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [msgQuery.rows[0].project_id, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ msg: 'Otorisasi ditolak' });
        }

        // 2. Ambil semua balasan untuk messageId ini
        const replies = await pool.query(
            `SELECT cm.*, u.full_name as sender_name 
             FROM chat_messages cm
             JOIN users u ON cm.user_id = u.user_id
             WHERE cm.parent_message_id = $1 
             ORDER BY cm.sent_at ASC`,
            [messageId]
        );

        res.json(replies.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- RUTE PROFIL (F1 & F5) ---
app.use('/api/profile', require('./profileRoutes'));

// --- RUTE UNDANGAN (F1) ---
app.use('/api/invitations', require('./invitationRoutes'));

server.listen(PORT, () => {
    console.log(`Server (Express + Socket.IO) berjalan di http://localhost:${PORT}`);
});