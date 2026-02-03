require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const analyticsRoutes = require('./src/routes/analytics.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log(`Analytics Service running on port ${PORT}`));

module.exports = app;
