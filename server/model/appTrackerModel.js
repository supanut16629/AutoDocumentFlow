const mongoose = require("mongoose");

const appTrackSchema = new mongoose.Schema({
    doc_Progress_ID:String,
    step_ID:Number,
    approver_ID:String,
    approval_Status:String,
})

const TrackModel = mongoose.model("app_tracker", appTrackSchema);

module.exports = TrackModel;