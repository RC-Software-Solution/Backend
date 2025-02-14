require("dotenv").config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./src/routes/user.routes");

const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);


const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
