const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role_Name: String,
  number_Of_People: Number,
  main_Role_ID: String,
  sub_Role_List_ID: [String],
});
const RoleModel = mongoose.model("roles", roleSchema);

module.exports = RoleModel;