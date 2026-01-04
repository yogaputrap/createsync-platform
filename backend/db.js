const { Pool } = require('pg');

const pool = new Pool({
    // Ganti nilai-nilai ini dengan info database PostgreSQL Anda
    user: 'postgres', // Biasanya 'postgres' secara default
    host: 'localhost',
    database: 'createsync', // Nama database yang kita buat
    password: 'Lumbalumba123#', // Ganti dengan password Anda
    port: 5432, // Port default PostgreSQL
});

// Ekspor pool agar bisa digunakan di file lain (seperti server.js)
module.exports = pool;