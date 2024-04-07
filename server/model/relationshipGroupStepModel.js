const mongoose = require("mongoose");

const relationshipGroupStepSchema = new mongoose.Schema({
  step_ID: Number,
  relationship_ID: String,
  sub_Role_Sender_ID: String, //change to sub_Role_Sender : String (sub_role_id)
  Approver_ID: String, //change to approver : String (user in role_Approval)
  // relationship_Type: String,
  // fixed_Person_Role2_ID: String,
});

const RelationshipGroupStepModel = mongoose.model("relationship_group_step",relationshipGroupStepSchema);

module.exports = RelationshipGroupStepModel;