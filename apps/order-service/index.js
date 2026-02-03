const express = require('express');
const app = express();
const cors = require('cors');
const orderRoutes = require('./src/routes/order.routes');
const internalAnalyticsRoutes = require('./src/routes/internalAnalytics.routes');

app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/internal/analytics', internalAnalyticsRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`))