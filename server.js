require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
console.log("PORT:", process.env.PORT);

// Routes
app.use("/api/users", require("./routes/signupEntry"));
app.use("/api/auth", require("./routes/signinEntry"));
app.use("/api/datasets", require("./routes/dataset.routes"));


app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at ${PORT}`);
});
