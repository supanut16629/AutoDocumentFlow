const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema({
    doc_Progress_ID:String,
    step_ID:Number,
    step_Name:String,
    date_Completed:Date,
    status_Step:String
})

const TrackModel = mongoose.model("tracks", trackSchema);

module.exports = TrackModel;