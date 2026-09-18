const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite database.');
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'nudget-super-secret-key', resave: false, saveUninitialized: false }));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, amount DECIMAL(10, 2) NOT NULL, category TEXT DEFAULT 'Uncategorized', date DATE DEFAULT CURRENT_DATE, note TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
});

// --- THE FIX: Force the server to hand over the HTML file ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auth Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) return res.status(400).json({ error: 'Username already taken' });
            res.json({ message: 'User created successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(400).json({ error: 'Incorrect password' });
        req.session.userId = user.id;
        res.json({ message: 'Logged in successfully' });
    });
});
// Add Expense Route
app.post('/expenses', (req, res) => {
    // Security check: Make sure they are actually logged in
    if (!req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in.' });
    }

    const { amount, category, note } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    // Save to SQLite
    db.run(`INSERT INTO expenses (user_id, amount, category, note) VALUES (?, ?, ?, ?)`,
        [req.session.userId, amount, category || 'Uncategorized', note],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Expense saved!' });
        }
    );
});
// Get Expenses Route
app.get('/expenses', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    
    db.all(`SELECT amount, category, note FROM expenses WHERE user_id = ? ORDER BY id DESC`, 
        [req.session.userId], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows); // Send the data back as a simple list
        }
    );
});
// --- CHANGED PORT TO 3001 ---
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));