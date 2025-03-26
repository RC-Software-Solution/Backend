const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Menu Service running on port ${PORT}`))