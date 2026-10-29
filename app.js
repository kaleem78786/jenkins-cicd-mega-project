const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
const ENV = process.env.APP_ENV || 'development';
const VERSION = process.env.APP_VERSION || 'v1';

// Main Route
app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 Welcome to DevOps Mega Edited CI/CD Project!</h1>
    <p><b>Environment:</b> ${ENV.toUpperCase()}</p>
    <p><b>Build Version:</b> ${VERSION}</p>
  `);
});

// Health Check Endpoint (Jenkins isko check karega)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    environment: ENV,
    version: VERSION,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App running on port ${PORT} in ${ENV} mode`);
});