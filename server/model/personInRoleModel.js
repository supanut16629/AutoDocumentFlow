const mongoose = require("mongoose");

const personInRoleSchema = new mongoose.Schema({
  role_ID: String,
  user_ID: String,
});
const PersonInRoleModel = mongoose.model("person_in_roles", personInRoleSchema);

module.exports = PersonInRoleModel;
