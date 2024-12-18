const express = require("express");
const path = require("path");
const sql = require("mssql");
const session = require("express-session");
const socketIo = require("socket.io");
const messageService = require("./kafka/messageService");
const { Configuration, OpenAIApi } = require("openai");
const http = require("http");
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

// Session Configuration
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

messageService.initializeSocket(io);

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));

// Routes
const userRoutes = require("./routes/userRoutes");
const mealRoutes = require("./routes/mealRoutes");
app.use("/users", userRoutes);
app.use("/meals", mealRoutes);

// Error Handling Middleware
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

// Error Handling for Internal Server Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Internal Server Error" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/users/login`);
});
