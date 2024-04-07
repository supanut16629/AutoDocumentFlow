const mongoose = require("mongoose");

const flowStepSchema = new mongoose.Schema({
  flow_ID: String,
  step_ID: Number,
  step_Type: String,
  //init
  user_Role_ID: String,
  add_Text: Array,
  add_Other_File: Array,
  // approval
  relationship_ID: String,
  role_Approver_ID: String,
  is_User_Select: String,
  topic_Send_To_Approve: String,
  order_Of_Sender_Role_ID: Number,
});
const FlowStepModel = mongoose.model("flow_steps", flowStepSchema);

module.exports = FlowStepModel;