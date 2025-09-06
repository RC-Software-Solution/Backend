require("dotenv").config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const deliveryRoutes = require("./src/routes/delivery.routes");

const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/delivery", deliveryRoutes);

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Delivery Service running on port ${PORT}`));
