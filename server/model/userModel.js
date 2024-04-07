const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: String,
  surname: String,
  email: String,
  password: String,
  isAdmin: Number,
});
const UserModel = mongoose.model("users", userSchema);

module.exports = UserModel;