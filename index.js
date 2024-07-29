require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const cookieparser = require("cookie-parser");
const { connectDB } = require("./connections/db");

connectDB();
app.use(
  cors({
    origins: "*",
    methods: ["GET,HEAD,PUT,PATCH,POST,DELETE"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cookieparser());

// mapping urls to specfic routes

app.use("/", require("./routes/loginRoute"));
app.use("/dashboard", require("./routes/DashboardRoute"));

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
