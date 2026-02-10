const express = require('express');
const fs = require('fs');
const cors = require('cors'); 
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const DATA_FILE = './users.json';

// Load user data from the local JSON file
const loadUsers = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error reading users.json:", error);
        return [];
    }
};

// Register a new user
app.post('/signup', (req, res) => {
    const { username, password, genres } = req.body;
    const users = loadUsers(); 

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const newUser = {
        id: Date.now(), 
        username,
        password,
        genres: genres || [],
        myList: [],
        skippedBooks: []
    };

    users.push(newUser);
    
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        res.json({ 
            success: true, 
            message: "Account created successfully!",
            user: newUser 
        });
    } catch (error) {
        console.error("File save error:", error);
        res.status(500).json({ success: false, message: "Server error saving account." });
    }
});

// Authenticate user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Retrieve the full book catalog
app.get('/books', (req, res) => {
    try {
        const CATALOG_PATH = path.join(__dirname, 'catalog-service', 'catalog.json');
        const data = fs.readFileSync(CATALOG_PATH, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Catalog read error:", error);
        res.status(500).json({ error: "Could not load book catalog" });
    }
});

// Get profile data for a specific user
app.get('/user/:id', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// Add a book to the user's personal list
app.post('/add-to-list', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex !== -1) {
        if (!users[userIndex].myList) users[userIndex].myList = [];

        if (!users[userIndex].myList.includes(bookId)) {
            users[userIndex].myList.push(bookId);
            fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
            res.json({ success: true, message: "Book added!" });
        } else {
            res.json({ success: false, message: "Book already in your list" });
        }
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// Remove a book from the user's personal list
app.post('/remove-from-list', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers();
    const user = users.find(u => u.id === parseInt(userId));

    if (user) {
        user.myList = user.myList.filter(id => id !== bookId);
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, message: "Book removed." });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// Mark a book as skipped so it doesn't appear again
app.post('/skip-book', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex !== -1) {
        if (!users[userIndex].skippedBooks) users[userIndex].skippedBooks = [];
        
        if (!users[userIndex].skippedBooks.includes(bookId)) {
            users[userIndex].skippedBooks.push(bookId);
            fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        }
        res.json({ success: true, message: "Book hidden." });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// Delete a user account
app.delete('/delete-account/:id', (req, res) => {
    try {
        let users = loadUsers();
        const userId = parseInt(req.params.id);
        const initialLength = users.length;
        
        users = users.filter(u => u.id !== userId);

        if (users.length === initialLength) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Server error during deletion" });
    }
});

app.listen(3000, () => console.log('User Service running on http://localhost:3000'));