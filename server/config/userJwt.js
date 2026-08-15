const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
       id: user.id,
    public_id: user.public_id,
      role: user.role,
      photo: user.photo,

    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );
};

module.exports = generateToken;