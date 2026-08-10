require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./config/db");

const companyImageRoute = require('./routes/imageRoute');
const adminRoute = require('./routes/adminRoute');
const userRoute = require('./routes/userRoute');
const companyRoute = require("./routes/companyRoute");
const mapRoute = require("./routes/mapRoute");
const systemRoute = require("./routes/systemRoute");
const healthRoute = require("./routes/healthRoute"); // fixed typo
const routeRoute = require("./routes/routeRoute");
const startHealthCheckCron = require('./service/cronJob');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://dashboard-41ru.onrender.com",
    "http://localhost:3001",
    "https://niawholesalelocator.onrender.com",
    /\.ngrok-free\.app$/,
    /\.trycloudflare\.com$/,
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH"]
}));

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/auth", adminRoute);
app.use("/api/user", userRoute);
app.use('/api/system', systemRoute);
app.use('/api/company', companyRoute);
app.use('/api/company/:id/images', companyImageRoute);
app.use('/api/map', mapRoute);
app.use('/api/route', routeRoute);
app.use('/api', healthRoute); // <-- mounted, gives you GET /api/health

app.get("/", (req, res) => {
  res.send("North Industrial Area GIS Locator API running");
});

const redis = require('./config/RedisClient');
redis.connect();

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  startHealthCheckCron(); // now runs after server confirms it's listening
});
