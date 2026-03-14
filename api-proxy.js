// api-proxy.js

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/data', async (req, res) => {
    try {
        // Fetch data from different sources
        const wriResponse = await axios.get('https://wri.org/api');
        const eiaResponse = await axios.get('https://eia.gov/api');
        const nstaResponse = await axios.get('https://nsta.org/api');

        // Process data from each source as needed
        const combinedData = {
            wri: wriResponse.data,
            eia: eiaResponse.data,
            nsta: nstaResponse.data
        };

        // Return the combined data in the expected format
        res.json(combinedData);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch data from sources."});
    }
});

app.listen(PORT, () => {
    console.log(`API Proxy is running on port ${PORT}`);
});