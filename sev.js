const express = require('express');
const path = require('path');
const fs = require('fs'); 

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Persistent Database
const DB_FILE = path.join(__dirname, 'database.json');
let db = { users: [], expenses: [] };

if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

const saveDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// --- AUTH ROUTES (Now Hacker-Proof against Typos/Spaces) ---
app.post('/register', (req, res) => {
    // Clean inputs: remove accidental spaces and make lowercase
    const cleanUsername = req.body.username.trim().toLowerCase();
    const cleanPassword = req.body.password.trim();

    if (db.users.find(u => u.username === cleanUsername)) {
        return res.status(400).json({ error: 'Username taken! Try logging in.' });
    }
    
    db.users.push({ username: cleanUsername, password: cleanPassword, customBudget: 5000 });
    saveDB();
    res.json({ success: true, username: cleanUsername });
});

app.post('/login', (req, res) => {
    const cleanUsername = req.body.username.trim().toLowerCase();
    const cleanPassword = req.body.password.trim();

    const user = db.users.find(u => u.username === cleanUsername);
    
    if (!user) {
        return res.status(401).json({ error: 'User not found. Please sign up!' });
    }
    if (user.password !== cleanPassword) {
        return res.status(401).json({ error: 'Incorrect password.' });
    }
    
    res.json({ success: true, username: cleanUsername });
});

// --- EXPENSE ROUTES ---
app.post('/expenses', (req, res) => {
    const { username, amount, category, note } = req.body;
    if (!username) return res.status(401).json({ error: 'Not logged in.' });
    
    db.expenses.push({ username: username.toLowerCase(), amount: Number(amount), category, note });
    saveDB();
    res.json({ success: true });
});

app.get('/expenses', (req, res) => {
    const { username } = req.query; 
    if (!username) return res.status(401).json({ error: 'Not logged in.' });
    
    const userExpenses = db.expenses.filter(e => e.username === username.toLowerCase());
    res.json(userExpenses);
});

// --- BUDGET ROUTES ---
app.post('/budget', (req, res) => {
    const { username, newBudget } = req.body;
    const user = db.users.find(u => u.username === username.toLowerCase());
    if (user && Number(newBudget) > 0) {
        user.customBudget = Number(newBudget);
        saveDB();
    }
    res.json({ success: true });
});

app.get('/budget', (req, res) => {
    const { username } = req.query;
    const user = db.users.find(u => u.username === username.toLowerCase());
    res.json({ budget: user ? user.customBudget : 5000 });
});

// --- SIMULATE FAST FORWARD ROUTE ---
app.post('/reset-cycle', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(401).json({ error: 'Not logged in.' });
    
    db.expenses = db.expenses.filter(e => e.username !== username.toLowerCase());
    saveDB();
    res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ClearSpend Server running on port ${PORT}`));