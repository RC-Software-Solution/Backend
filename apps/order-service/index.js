const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`))