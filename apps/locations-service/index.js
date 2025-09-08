const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const areaRoutes = require('./src/routes/area.routes');
app.use('/api/areas', areaRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`Locations Service running on port ${PORT}`));


