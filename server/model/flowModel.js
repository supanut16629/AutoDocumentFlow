const mongoose = require("mongoose");

const flowSchema = new mongoose.Schema({
  flow_Name: String,
  all_Order_Of_Sender_Role_ID: Array,
});

const FlowModel = mongoose.model("flows", flowSchema);

module.exports = FlowModel;