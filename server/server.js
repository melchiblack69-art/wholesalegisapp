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

const app = express();

// Cors Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://dashboard-41ru.onrender.com",
    "http://localhost:3001",
    "https://admin-portal-c3a6.onrender.com",
    /\.ngrok-free\.app$/,
    /\.trycloudflare\.com$/,
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH"]
}));

app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/auth", adminRoute);
app.use("/api/user", userRoute);

// Routes
  
app.use('/api/system', systemRoute);  
app.use('/api/company', companyRoute); 
app.use('/api/company/:id/images', companyImageRoute); 
app.use('/api/map', mapRoute);

app.get("/", (req, res) => {
  res.send("North Industrial Area GIS Locator API running");
});

// Connect Redis (non-blocking — server starts even if Redis is unavailable)
const redis = require('./config/RedisClient');
redis.connect();
// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));


 