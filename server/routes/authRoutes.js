const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const UserModel = require("../model/userModel");

router.post("/signup", async (req, res) => {
  const { firstname, surname, email, isAdmin, password } = req.body;
  try {
    bcrypt.hash(password, saltRounds, async function (err, hash) {
      ///
      const newUser = new UserModel({
        firstname: firstname,
        surname: surname,
        email: email,
        password: hash,
        isAdmin: isAdmin,
      });
      await newUser.save();
      return res.json({
        status: "ok",
        message: "New user Successfully created!",
      });
    });
  } catch (err) {
    console.error("Error = ", err);
    return res.json({ status: "error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    //Authenticate User
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      // No user found with the specified email
      return res.json({
        status: "error",
        message: "no user found (status 401)",
      });
    }
    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        // Passwords match, generate and return a JWT token
        const token = jwt.sign(
          { email: user.email },
          process.env.ACCESS_TOKEN_SECRET
          // { expiresIn: 3600 }
        );
        console.log("User from Backend", user);
        return res.json({ status: "ok", token, data: user });
      } else {
        // Passwords do not match
        res.json({ status: "error", message: "no user found (status 401)" });
      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

router.post("/verify", function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401).json({ status: "token error" });
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
    if (err) return res.json({ status: "error", message: err });
    //data = email ,iat,exp
    res.json({ status: "ok", data });
  });
});

router.post("/checkEmailRepeat", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      // Email is already in use
      return res.json({ status: "repeat" });
    } else {
      // Email is not in use
      return res.json({ status: "ok" });
    }
  } catch (error) {
    console.error("Error checking email repetition:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
