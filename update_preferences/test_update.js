const http = require('http');

const data = JSON.stringify({
    userId: 31,
    tags: ["Fantasy", "Cooking", "Sci-Fi"] // 'Cooking' is a test case to see if it gets filtered out
});

const options = {
    hostname: 'localhost',
    port: 3007,
    path: '/update',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
        console.log('Server Response:', JSON.parse(responseData));
    });
});

req.on('error', (e) => console.error('Problem with request:', e.message));
req.write(data);
req.end();