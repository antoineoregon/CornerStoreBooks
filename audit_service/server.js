const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors')
const app = express();

app.use(cors());
app.use(express.json());
const LOG_FILE = path.join(__dirname, 'logs.json');

app.post('/log', (req, res) => {
    const { type, userId, data } = req.body;
    const entry = {
        timestamp: new Date().toISOString(),
        type, 
        userId,
        data
    };

    // Safely read the existing file
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        const fileContent = fs.readFileSync(LOG_FILE, 'utf8');
        if (fileContent.trim() !== "") {
            try {
                logs = JSON.parse(fileContent);
            } catch (e) {
                console.error("Error parsing logs.json, starting fresh.");
            }
        }
    }
    
    // Append the new entry
    logs.push(entry);
    
    // Write back to file
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    
    res.status(201).json({ success: true });
});

app.listen(3008, () => console.log('Audit Service running on port 3008'));