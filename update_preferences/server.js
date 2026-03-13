const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3007;
const USERS_PATH = path.join(__dirname, '..', 'user-service', 'users.json');
const CATALOG_PATH = path.join(__dirname, '..', 'user-service', 'catalog-service', 'catalog.json');

// Ensure the route is marked 'async'
app.post('/update', async (req, res) => {
    const { userId, tags } = req.body;

    // 1. Load data
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    // 2. Find user first to get 'old' tags
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const oldTags = user.genres || []; // Capture before update
    
    // 3. Extract unique valid tags from catalog
    const validTags = [...new Set(catalog.map(item => item.genre))];

    // 4. Filter/Intersect: Keep only tags that exist in the catalog
    const newTags = tags.filter(tag => validTags.includes(tag));

    // 5. Update the user
    user.interest_tags = newTags;
    user.genres = newTags;

    // 6. Atomic write
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    // 7. Audit log (using the variables we captured)
    try {
        await fetch('http://localhost:3008/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'PREFERENCE_CHANGE',
                userId: userId,
                data: { old_tags: oldTags, new_tags: newTags }
            })
        });
    } catch (err) {
        console.error("Audit logging failed for preference change:", err);
    }

    res.json({ success: true, tags: newTags });
});

app.listen(PORT, () => console.log(`Update Preference Service running on port ${PORT}`));