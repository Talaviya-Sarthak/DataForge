const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/signupEntry"));
app.use("/api/auth", require("./routes/signinEntry"));

app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});

app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
