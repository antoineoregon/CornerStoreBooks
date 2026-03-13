const fs = require('fs');
const path = require('path');

// Helper to read and parse JSON
const readData = (file) => {
    if (!fs.existsSync(file)) {
        console.error(`ERROR: File not found at ${file}`);
        throw new Error('FILE_NOT_FOUND');
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

// Based on your confirmed paths:

const USERS_PATH = path.join(__dirname, '..', 'user-service', 'users.json');
const ITEMS_PATH = path.join(__dirname, '..', 'user-service', 'catalog-service', 'catalog.json');

exports.getRecommendations = (userId) => {
    // 1. Load the data
    const users = readData(USERS_PATH);
    const items = readData(ITEMS_PATH);
    
    // 2. Find the user (comparing both as strings to avoid BigInt issues)
    const user = users.find(u => String(u.id) === String(userId));
    
    // 3. If user doesn't exist, throw the error that server.js is looking for
    if (!user) {
        console.warn(`User ${userId} not found in database.`);
        throw new Error('NOT_FOUND');
    }

    // 4. Ensure user.genres exists and is an array before filtering
    const userGenres = Array.isArray(user.genres) ? user.genres : [];

    // 5. Filter the catalog
    return items.filter(item => {
        if (!item.genre) return false;
        
        // Use .trim() with parentheses to call the function
        const bookGenre = item.genre.trim();
        
        return userGenres.includes(bookGenre);
    });
};