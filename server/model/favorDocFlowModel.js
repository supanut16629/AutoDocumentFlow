const mongoose = require("mongoose");

const favorDocFlowSchema = new mongoose.Schema({
  user_ID: String,
  flow_ID: String,
});

const FavorDocFlowModel = mongoose.model("favor_doc_flows", favorDocFlowSchema);

module.exports = FavorDocFlowModel;