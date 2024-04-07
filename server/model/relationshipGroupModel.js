const mongoose = require("mongoose");

const relationshipGroupSchema = new mongoose.Schema({
  relationship_Name: String,
  role_Sender_ID: String, 
  role_Approval_ID: String,
});
const RelationshipGroupModel = mongoose.model("relationship_groups",relationshipGroupSchema);

module.exports = RelationshipGroupModel;