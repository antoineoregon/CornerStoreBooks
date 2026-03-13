const express = require('express');
const cors = require('cors'); // You MUST have this installed
const service = require('./recommendation_service');
const app = express();


app.use(cors()); // <--- This line must come BEFORE your routes
app.use(express.json());

// Return item recommendations for a given user
app.get('/recommendations/:userId', (req, res) => {
    try {
        // Change: Don't parse as int, keep as string
        const userId = req.params.userId; 
        const results = service.getRecommendations(userId);
        res.json(results);
    } catch (err) {
        // Handle the specific 'NOT_FOUND' error we threw in the service
        const status = err.message === 'NOT_FOUND' ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
});

app.listen(3005, () => {
    console.log('Personalized Feed Service running on port 3005');
});