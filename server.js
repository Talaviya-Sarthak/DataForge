const express = require("express");
const cors = require("cors");

const app = express();

// MIDDLEWARE
app.use(
  cors({
    origin: "http://localhost:5173", // 👈 your frontend URL
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TEST SERVER
app.get("/server", (req, res) => {
  res.send("Server running OK 🚀");
});

// 🔗 CONNECT AUTH ROUTES
app.use("/api/auth", require("./routes/signupEntry.js"));

// START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
