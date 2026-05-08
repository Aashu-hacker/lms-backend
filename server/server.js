require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

const server = http.createServer(app);

// ✅ Define io here
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store connected users
global.onlineUsers = new Map();

// TRUST PROXY (important on Render sometimes)
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "https://lms-frontend-zjp6.onrender.com"
];

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  console.log("Method:", req.method);
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS Origin:", origin);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// ==============================|| SOCKET CONNECTION ||============================== //
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Frontend sends logged-in user ID
  socket.on("registerUser", (userId) => {
    global.onlineUsers.set(userId, socket.id);
    console.log("Registered User:", userId);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of global.onlineUsers.entries()) {
      if (socketId === socket.id) {
        global.onlineUsers.delete(userId);
        break;
      }
    }

    console.log("User Disconnected:", socket.id);
  });
});

// ✅ Export io globally
global.io = io;

app.use(cors(corsOptions));

// HANDLE PREFLIGHT EXPLICITLY
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => {
  res.send("MongoDB Connected Successfully 🚀");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));