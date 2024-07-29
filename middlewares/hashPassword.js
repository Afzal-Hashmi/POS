const { createHmac, randomBytes } = require("crypto");

async function hashPassword(password) {
  const salt = randomBytes(16).toString();
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return { salt, hash };
}

async function verifyHashPassword(salt, password, hashedPassword) {
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return hashedPassword === hash;
}

module.exports = { hashPassword, verifyHashPassword };
