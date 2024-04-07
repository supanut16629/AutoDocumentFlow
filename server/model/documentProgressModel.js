const mongoose = require("mongoose");

const documentProgressSchema = new mongoose.Schema({
    user_ID:String,
    flow_ID:String,
    sending_Doc_Name:String,
    dateTime_Create:Date, //วันเวลาที่สร้าง
    lastTime_Edit:Date,
    doc_Status:String, //waiting,success,fail
    total_State:Number, //ขั้นตอนทั้งหมด
    current_State:Number, //ขั้นตอนปัจจุบัน
    name_Document_File:String, //เก็บชื่อไฟล์
    // เก็บรายละเอียดเพิ่ม
    data_Add_Text: [{
        topic: String,
        type_Answer: String,
        answer: [mongoose.Schema.Types.Mixed],
    }],
    data_Add_Other_File:[{
        topic: String,
        file: String,
    }],
    data_User_Select_Approver:Array, //เก็บผู้อนุมัติที่เลือกเพิ่มเติม
    sender_Order:[String], //ลิสผู้ส่ง
})

const DocumentProgressModel = mongoose.model("document_progress", documentProgressSchema);

module.exports = DocumentProgressModel;