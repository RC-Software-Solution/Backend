const express = require('express');
const app = express();
const cors = require('cors');
const orderRoutes = require('./src/routes/order.routes');

app.use(cors());
app.use(express.json());

app.use("/api/orders", orderRoutes)

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`))