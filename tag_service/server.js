const express = require('express');
const cors = require('cors');
const service = require('./tag_service');
const app = express();

app.use(cors());
app.use(express.json());


// Endpoint for the Settings checkboxes
app.get('/all-genres', (req, res) => {
    try {
        const genres = service.getAllGenres();
        res.json(genres);
    } catch (err) {
        res.status(500).json({ error: "Failed to load genres" });
    }
});

// Endpoint for User Story 1
app.get('/tags/stats', (req, res) => {
    try {
        const stats = service.getTagStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: "Failed to aggregate tags" });
    }
});

// Endpoint for User Story 2
app.get('/tags/discovery/:userId', (req, res) => {
    try {
        const tags = service.getDiscoveryTags(req.params.userId);
        res.json(tags);
    } catch (err) {
        const status = err.message === 'NOT_FOUND' ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
});

app.listen(3006, () => {
    console.log('Tag Aggregation Service running on port 3006');
});