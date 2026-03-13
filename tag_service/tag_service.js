const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '..', 'user-service', 'users.json');
const ITEMS_PATH = path.join(__dirname, '..', 'user-service', 'catalog-service', 'catalog.json');

const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// Define functions normally (no 'exports.' prefix)
function getTagStats() {
    const items = readData(ITEMS_PATH);
    const stats = {};
    items.forEach(item => {
        if (item.genre) {
            const genre = item.genre.trim();
            stats[genre] = (stats[genre] || 0) + 1;
        }
    });
    return stats;
}

function getDiscoveryTags(userId) {
    const users = readData(USERS_PATH);
    const items = readData(ITEMS_PATH);
    const user = users.find(u => String(u.id) === String(userId));
    if (!user) throw new Error('NOT_FOUND');
    const allTags = [...new Set(items.map(item => item.genre.trim()))];
    const userPrefs = user.genres || [];
    return allTags.filter(tag => !userPrefs.includes(tag));
}

function getAllGenres() {
    const items = readData(ITEMS_PATH);
    return [...new Set(items.map(item => item.genre.trim()))];
}

// Export all functions together
module.exports = {
    getTagStats,
    getDiscoveryTags,
    getAllGenres
};