require("dotenv").config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./src/routes/user.routes");
const authRoutes = require("./src/routes/auth.routes");
const internalAnalyticsRoutes = require("./src/routes/internalAnalytics.routes");
const customerRoutes = require("./src/routes/customer.routes");

const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Authentication routes (login, forgot-password, reset-password)
app.use("/api/users", authRoutes);

// User management routes (signup, profile, etc.)
app.use("/api/users", userRoutes);

// Customer management (admin/super_admin only)
app.use("/api/users/customers", customerRoutes);

// Internal analytics (service-to-service only)
app.use("/api/internal/analytics", internalAnalyticsRoutes);


const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
