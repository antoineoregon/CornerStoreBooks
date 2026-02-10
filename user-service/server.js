const express = require('express');
const fs = require('fs');
const cors = require('cors'); 
const app = express();
const path = require('path');

app.use(express.json());
app.use(cors());

const DATA_FILE = './users.json';

// HELPER FUNCTION: Safely load users as an array
const loadUsers = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        // If file is empty, return empty array; otherwise parse it
        const parsed = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error reading users.json:", error);
        return [];
    }
};

// Sign-Up Route
app.post('/signup', (req, res) => {
    const { username, password, genres } = req.body;
    const users = loadUsers(); 

    // Check if user already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const newUser = {
        id: Date.now(), 
        username,
        password,
        genres: genres || [],
        myList: [],
        skippedBooks: [] // Added to match your updated JSON structure
    };

    users.push(newUser);
    
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        
        // CRITICAL UPDATE: Send back the 'user' object so app.js can log them in
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

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers(); // Use helper
    
    // This will no longer crash because 'users' is guaranteed to be an array
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username } });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

app.get('/books', (req, res) => {
    try {
        const CATALOG_PATH = path.join(
            __dirname,
            'catalog-service',
            'catalog.json'
        );

        const data = fs.readFileSync(CATALOG_PATH, 'utf8');
        const books = JSON.parse(data);

        res.json(books);
    } catch (error) {
        console.error("Catalog read error:", error);
        res.status(500).json({ error: "Could not load book catalog" });
    }
});

app.post('/add-to-list', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers(); // Use helper

    const userIndex = users.findIndex(u => u.id === parseInt(userId)); // Added parseInt for safety

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

// Add this to server.js
app.get('/user/:id', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

app.delete('/delete-account/:id', (req, res) => {
    let users = loadUsers(); // Use helper
    const userId = parseInt(req.params.id);
    
    users = users.filter(u => u.id !== userId);
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: "Account deleted" });
});

// Get a single user's data
app.get('/user/:id', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

//Skip Book

app.post('/skip-book', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(userId));

    if (userIndex !== -1) {
        if (!users[userIndex].skippedBooks) {
            users[userIndex].skippedBooks = [];
        }
        // Only add if not already skipped
        if (!users[userIndex].skippedBooks.includes(bookId)) {
            users[userIndex].skippedBooks.push(bookId);
            fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        }
        res.json({ success: true, message: "Book hidden." });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

// Remove Book from list
app.post('/remove-from-list', (req, res) => {
    const { userId, bookId } = req.body;
    let users = loadUsers(); // Assuming you have a loadUsers helper
    const user = users.find(u => u.id === parseInt(userId));

    if (user) {
        // Remove the bookId from the array
        user.myList = user.myList.filter(id => id !== bookId);
        
        // Save the updated list back to users.json
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, message: "Book removed." });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});


// Delete Route
app.delete('/delete-account/:id', (req, res) => {
    try {
        let users = loadUsers(); // Use your helper function
        const userId = parseInt(req.params.id);
        
        // Check if user exists
        const userExists = users.some(u => u.id === userId);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Filter out the user with the matching ID
        const updatedUsers = users.filter(u => u.id !== userId);
        
        // Save the updated list back to users.json
        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedUsers, null, 2));
        
        res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Backend Delete Error:", error);
        res.status(500).json({ success: false, message: "Server error during deletion" });
    }
});

app.listen(3000, () => console.log('User Service running on http://localhost:3000'));