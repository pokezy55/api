const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path'); // Untuk bekerja dengan path file

const app = express();
const PORT = process.env.PORT || 3000; // Port tempat server akan berjalan
const DATABASE_FILE = path.join(__dirname, 'users.json'); // Path ke file database

// Middleware untuk mem-parsing JSON body dari request
app.use(bodyParser.json());

// --- Fungsi Database (Sama seperti sebelumnya, tapi sekarang di server) ---
function loadUsers() {
    try {
        if (fs.existsSync(DATABASE_FILE)) {
            const data = fs.readFileSync(DATABASE_FILE, 'utf8');
            const users = JSON.parse(data);
            for (const username in users) {
                if (users.hasOwnProperty(username) && !users[username].hasOwnProperty('credit')) {
                    users[username].credit = 0;
                }
            }
            return users;
        }
    } catch (error) {
        console.error("Error loading users data:", error.message);
    }
    return {};
}

function saveUsers(users) {
    try {
        fs.writeFileSync(DATABASE_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error("Error saving users data:", error.message);
    }
}

// --- API Endpoint untuk Menambah Kredit (Hanya untuk Admin) ---
// PENTING: Ini sangat dasar dan TIDAK memiliki otentikasi/otorisasi yang kuat.
// Dalam produksi, Anda harus melindungi endpoint ini dengan login admin yang aman!

app.post('/admin/add-credit', (req, res) => {
    const { username, amount, adminKey } = req.body; // Menerima data dari body request

    // --- SIMULASI AUTENTIKASI ADMIN SANGAT Sederhana ---
    // Dalam produksi: verifikasi token JWT, cek role pengguna, dll.
    const SECRET_ADMIN_KEY = 'supersecretadminpassword123'; // JANGAN PAKAI INI DI PRODUKSI!
    if (adminKey !== SECRET_ADMIN_KEY) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Invalid admin key' });
    }
    // --- AKHIR SIMULASI AUTENTIKASI ---

    if (!username || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid input: username and positive amount are required.' });
    }

    let users = loadUsers();

    if (users[username]) {
        users[username].credit += amount;
        saveUsers(users);
        res.status(200).json({
            success: true,
            message: `Successfully added ${amount} credit to ${username}.`,
            newBalance: users[username].credit
        });
    } else {
        res.status(404).json({ success: false, message: 'User not found.' });
    }
});

// --- API Endpoint untuk Cek Kredit (Bisa juga dilindungi) ---
app.get('/user/:username/credit', (req, res) => {
    const username = req.params.username; // Mengambil username dari URL parameter
    let users = loadUsers();

    if (users[username]) {
        res.status(200).json({
            success: true,
            username: username,
            credit: users[username].credit
        });
    } else {
        res.status(404).json({ success: false, message: 'User not found.' });
    }
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Untuk menambah kredit (POST): http://localhost:${PORT}/admin/add-credit`);
    console.log(`Untuk cek kredit (GET): http://localhost:${PORT}/user/:username/credit`);
    console.log(`\nPERINGATAN: Server ini TIDAK AMAN untuk produksi tanpa autentikasi/otorisasi yang tepat.`);
});
