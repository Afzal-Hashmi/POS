const { verifyToken } = require("./authUser");

function checkCookie(tokenName) {
  return (req, res, next) => {
    const token = req.cookies[tokenName];
    // if (!token) {
    //   return res.status(403).redirect("/");
    // }
    try {
      const payload = verifyToken(token);
      req.user = payload;
    } catch (error) {}
    return next();
  };
}

module.exports = checkCookie;
