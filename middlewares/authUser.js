const jwt = require("jsonwebtoken");

function generateToken(user) {
  const payload = {
    username: user.username,
    email: user.email,
    permission: user.permission,
  };
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    return token;
  } catch (error) {
    throw new Error({ message: "Cannot generate token" });
  }
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error({ message: "Invalid token" });
  }
}

module.exports = { generateToken, verifyToken };
