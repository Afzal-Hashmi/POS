const { client } = require("../connections/db");
const router = require("express").Router();
const checkCookie = require("../middlewares/checkCookie");
const {
  hashPassword,
  verifyHashPassword,
} = require("../middlewares/hashPassword");
const { generateToken } = require("../middlewares/authUser");

router.get("/", checkCookie("authToken"), (req, res) => {
  if (req.user) return res.redirect("/dashboard");
  return res.render("login");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .render("login", { message: "Please fill all the fields" });

  try {
    const user = await client.query(
      `SELECT username , email, hashedpassword, salt , permission FROM userdetails WHERE email = '${email}'`
    );
    if (user.rows.length === 0)
      return res
        .status(400)
        .render("login", { message: "User does not exist" });

    const isPasswordValid = await verifyHashPassword(
      user.rows[0].salt,
      password,
      user.rows[0].hashedpassword
    );
    if (!isPasswordValid)
      return res
        .status(400)
        .render("login", { message: "Password is incorrect" });

    const token = generateToken(user.rows[0]);

    return res.status(200).cookie("authToken", token).redirect("/dashboard");
  } catch (error) {
    return res
      .status(500)
      .render("login", { message: "Internal Server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { username, email, password, ownercode } = req.body;
  if (!username || !email || !password || !ownercode)
    return res
      .status(400)
      .render("signup", { message: "Please fill all the fields" });
  try {
    const user = await client.query(
      `SELECT email FROM userdetails WHERE email = '${email}'`
    );
    if (user.rows.length !== 0)
      return res
        .status(400)
        .render("signup", { message: "User already exists" });

    const { salt, hash } = await hashPassword(password);

    if (ownercode !== process.env.ownerCode)
      return res.status(400).json({ message: "Owner code is incorrect" });

    const result = await client.query(
      `INSERT INTO userdetails (username, email, hashedpassword, salt, permission) VALUES ('${username}', '${email}', '${hash}', '${salt}', 'admin')`
    );

    if (result.rowCount === 1)
      return res.status(200).render("login", {
        message: "Registration successful. Please login.",
      });
  } catch (error) {
    return res
      .status(500)
      .render("signup", { message: "Internal Server error" });
  }
});

router.get("/logout", (req, res) => {
  return res.clearCookie("authToken").redirect("/");
});

module.exports = router;
