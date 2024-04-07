const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require("http");
const nodemailer = require("nodemailer");
const cors = require("cors");
const port = 5000;
const moment = require("moment");
const app = express();
const server = http.createServer(app);
const path = require("path");
// const socketIo = require('socket.io');
// const io = socketIo(server);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

//connect mongoDB
const mongoose = require("mongoose");
mongoose.connect(process.env.URI_DATABASE_2214);

const db = mongoose.connection;
db.on("connected", () => {
  console.log("Connected to MongoDB");
});
db.on("error", () => {
  console.log("MongoDB connection error:");
});

app.use(cors());
app.use(express.json());
// กำหนดให้ Express ใช้ middleware สำหรับแปลงข้อมูล URL-encoded
app.use(express.urlencoded({ extended: true }));
//by part Axios
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// io.use(cors({
//   origin: 'http://localhost:3000', // หรือ '*' เพื่ออนุญาตให้ทุกโดเมนเข้าถึง
//   methods: ['GET', 'POST'] // กำหนดว่าคำสั่งใด ๆ จะถูกอนุญาต
// }));
// io.on('connection', (socket) => {
//   console.log('A client connected');

//   socket.on('disconnect', () => {
//     console.log('A client disconnected');
//   });

//   // Handle other events here...
// });
wss.on("connection", (ws) => {
  console.log("A client connected");

  ws.on("close", () => {
    console.log("A client disconnected");
  });

  // Handle other events here...
});
wss.on("error", (error) => {
  console.error("WebSocket server encountered an error:", error);
  // Handle other events here...
});
const PersonInRoleModel = require("./model/personInRoleModel");
const RelationshipGroupStepModel = require("./model/relationshipGroupStepModel");
const RoleModel = require("./model/roleModel");
const FlowModel = require("./model/flowModel");
const FlowStepModel = require("./model/flowStepModel");
const DocumentProgressModel = require("./model/documentProgressModel");
const TrackModel = require("./model/trackModel");
const AppTrackerModel = require("./model/appTrackerModel");

const trackChangeStream = TrackModel.watch();
const appTrackerChangeStream = AppTrackerModel.watch();
const documentProgressChangeStream = DocumentProgressModel.watch();

trackChangeStream.on("change", async (change) => {
  // console.log("ChangeTrack occurred:", change);
  console.log(
    "line 79 Track ChangeStream Start !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! track id=",
    change.documentKey._id
  );
  //insert
  if (change.operationType === "insert") {
    // กรณี พึ่งเพิ่มinit มาใหม่
    if (
      change.fullDocument.step_ID === 0 &&
      change.fullDocument.step_Name === "Initial" &&
      change.fullDocument.status_Step === "waiting"
    ) {
      const newStep_ID = change.fullDocument.step_ID + 1;
      const docProgress = await DocumentProgressModel.findOne({
        _id: change.fullDocument.doc_Progress_ID,
      });
      const flowStep = await FlowStepModel.find({
        flow_ID: docProgress.flow_ID,
      });
      const thaiDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      });

      //อัพเดท Track เก่าก่อน
      const updateOldTrackProgress = await TrackModel.findOneAndUpdate(
        { _id: change.documentKey._id },
        { date_Completed: thaiDate, status_Step: "success" },
        { new: true }
      );

      const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
        { _id: updateOldTrackProgress.doc_Progress_ID },
        {
          lastTime_Edit: thaiDate,
          current_State: newStep_ID, //+1
        },
        { new: true }
      );
      console.log("update doc progress in ");

      // เพิ่ม Track ใหม่
      const newTrack = new TrackModel({
        doc_Progress_ID: updateOldTrackProgress.doc_Progress_ID,
        step_ID: newStep_ID,
        step_Name: flowStep[newStep_ID].step_Type,
        status_Step: "waiting",
      });
      await newTrack.save();
    }
    //กรณี เพิ่ม Track ตอนๆมา ถ้าเป็น Approval สถานะ = {waiting}
    else if (
      change.fullDocument.step_ID > 0 &&
      change.fullDocument.step_Name === "Approval" &&
      change.fullDocument.status_Step === "waiting"
    ) {
      const docProgress = await DocumentProgressModel.findOne({
        _id: change.fullDocument.doc_Progress_ID,
      });

      const flowStep = await FlowStepModel.find({
        flow_ID: docProgress.flow_ID,
      });
      const foundFlowStep = flowStep.find(
        (flow) => flow.step_ID === change.fullDocument.step_ID
      );
      const numberOrderOfSender = foundFlowStep.order_Of_Sender_Role_ID;
      console.log("orderOfSender =", numberOrderOfSender);

      // const user_ID = docProgress.user_ID;
      const thaiDate = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      });
      //หาคนอนุมัติ
      const approvalStep = flowStep[change.fullDocument.step_ID];
      let approver;
      // มีRelationship
      if (approvalStep?.relationship_ID) {
        const listuserInRole = await PersonInRoleModel.find({
          user_ID: docProgress.sender_Order[numberOrderOfSender],
        }); //user คนนี้อาจจะมีหลาย Role
        const listRoleID = listuserInRole.map((item) => item.role_ID); //list Role_ID
        const relationshipStep = await RelationshipGroupStepModel.find({
          relationship_ID: approvalStep.relationship_ID,
        });
        const findRelationshipStep = relationshipStep.find((rel) =>
          listRoleID.includes(rel.sub_Role_Sender_ID)
        );
        approver = findRelationshipStep.Approver_ID; //ID
        console.log("have sender =", approver);
      } else {
        if (approvalStep?.is_User_Select === "userSelect") {
          const dataApprover = docProgress.data_User_Select_Approver.find(
            (data) => data.step_ID === change.fullDocument.step_ID
          );
          approver = dataApprover.approver_ID;
        }
      }

      // เพิ่ม appTracker
      const newAppTracker = new AppTrackerModel({
        doc_Progress_ID: change.fullDocument.doc_Progress_ID,
        step_ID: change.fullDocument.step_ID,
        approver_ID: approver,
        approval_Status: "waiting",
      });
      await newAppTracker.save();

      //ส่ง E-mail ไปหาผู้อนุมัติ
      // เดี๋ยวไปทำใน AppTrackerChangeStream
      //ส่งไป ที่ Approval

      //อัพเดท DocProgress
      console.log("Before update DocProgress Approval =", approver);
      const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
        { _id: change.fullDocument.doc_Progress_ID },
        {
          $set: {
            lastTime_Edit: thaiDate,
            current_State: change.fullDocument.step_ID,
          },
          $push: {
            sender_Order: approver,
          },
        },
        { new: true }
      );
      console.log("last update DocProgress in Approval", updateDocProgress);
    }
    //  else if (
    //   change.fullDocument.step_ID > 0 &&
    //   change.fullDocument.step_Name === "SendResponse" &&
    //   change.fullDocument.status_Step === "waiting"
    // ) {
    //   const thaiDate = new Date().toLocaleString("en-US", {
    //     timeZone: "Asia/Bangkok",
    //   });
    //   //อัพเดท Track เก่าก่อน sendResponse เป็น success
    //   const updateOldTrackProgress = await TrackModel.findOneAndUpdate(
    //     { _id: change.documentKey._id },
    //     { date_Completed: thaiDate, status_Step: "success" },
    //     { new: true }
    //   );
    //   //update DocProgress เป็น success
    //   const updatedDocProgress = await DocumentProgressModel.findOneAndUpdate(
    //     { _id: updateOldTrackProgress.doc_Progress_ID },
    //     {
    //       current_State: updateOldTrackProgress.step_ID,
    //       lastTime_Edit: thaiDate,
    //       doc_Status: "success",
    //     },
    //     { new: true }
    //   );
    // }
  }
  // console.log("OperationType :", change.operationType);
  // else if (change.operationType === "update") {
  //   console.log("have update line235");
  //   console.log("update value line236", change.updateDescription.updatedFields);
  //   const idTrack = change.documentKey._id;
  //   const findUpdatedTrack = await TrackModel.findOne({ _id: idTrack }); //TrackUpdated
  //   console.log("line240 track ID =", idTrack);
  //   console.log("line 241 findUpdatedTrack =", findUpdatedTrack);

  //   const docProgress = await DocumentProgressModel.findOne({
  //     _id: findUpdatedTrack.doc_Progress_ID,
  //   });

  //   const updateStatusStep = change.updateDescription.updatedFields.status_Step;
  //   const date_Completed =
  //     change.updateDescription.updatedFields.date_Completed;
  //   // console.log(
  //   //   "line 245 before if updateStatusStep=",
  //   //   updateStatusStep,
  //   //   " & findUpdatedTrack.step_Name",
  //   //   findUpdatedTrack.step_Name
  //   // );

  //   if (
  //     updateStatusStep === "success" &&
  //     (findUpdatedTrack.step_Name === "Initial" ||
  //       findUpdatedTrack.step_Name === "Approval")
  //   ) {
  //     console.log("have status= Success And Step = Initial or Approval 250");
  //     const flowStep = await FlowStepModel.find({
  //       flow_ID: docProgress.flow_ID,
  //     });
  //     const newStep_ID = findUpdatedTrack.step_ID + 1;
  //     // เพิ่ม Track ใหม่
  //     console.log("new Track line 255");
  //     const newTrack = new TrackModel({
  //       doc_Progress_ID: findUpdatedTrack.doc_Progress_ID,
  //       step_ID: newStep_ID,
  //       step_Name: flowStep[newStep_ID].step_Type,
  //       status_Step: "waiting",
  //     });
  //     await newTrack.save();
  //     console.log("***********insert new Track finish line 264=", newTrack);
  //     //อัพเดท Document Progress
  //     const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
  //       { _id: findUpdatedTrack.doc_Progress_ID },
  //       {
  //         lastTime_Edit: date_Completed,
  //         current_State: newStep_ID, //+1
  //       },
  //       { new: true }
  //     );
  //     wss.clients.forEach((client) => {
  //       if (client.readyState === WebSocket.OPEN) {
  //         console.log("send to Client from UPDATE APPTRACKER");
  //         const jsonData = JSON.stringify({
  //           track: newTrack,
  //           docProgress: updateDocProgress,
  //           type: "update track",
  //         });
  //         client.send(jsonData);
  //       }
  //     });

  //   } else if (
  //     updateStatusStep === "fail" &&
  //     findUpdatedTrack.step_Name === "Approval"
  //   ) {
  //     // update DocProgress
  //     const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
  //       { _id: findUpdatedTrack.doc_Progress_ID },
  //       {
  //         lastTime_Edit: date_Completed,
  //         doc_Status: updateStatusStep,
  //       },
  //       {new:true}
  //     );

  //     wss.clients.forEach((client) => {
  //       if (client.readyState === WebSocket.OPEN) {
  //         console.log("send to Client from UPDATE APPTRACKER");
  //         const jsonData = JSON.stringify({
  //           track: findUpdatedTrack,
  //           docProgress: updateDocProgress,
  //           type: "update track",
  //         });
  //         client.send(jsonData);
  //       }
  //     });
  //   }
  // }
});

documentProgressChangeStream.on("change", async (changeDocProgress) => {
  console.log(
    "line 299 Document ChangeStream Start !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! docPro id=",
    changeDocProgress.documentKey._id
  );
  // console.log("changeDocProgress occurred:", changeDocProgress);
  // changeDocProgress.operationType if === udpate ตอนแรก
  const id = changeDocProgress.documentKey._id;
  const docProgress = await DocumentProgressModel.findOne({ _id: id });
  if (
    changeDocProgress.operationType === "insert" ||
    changeDocProgress.operationType === "udpate"
  ) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(
          "send to Client from UPDATE Document Progress ****************************************** send Data ************************************* =",
          docProgress
        );
        const jsonData = JSON.stringify({
          docProgress: docProgress,
          type: "DocumentProgress",
        });
        client.send(jsonData);
      }
    });
  } else {
    console.log("line 344", changeDocProgress);
  }

  console.log(
    "line 313 Document ChangeStream Finish !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! docPro id=",
    changeDocProgress.documentKey._id
  );
});

appTrackerChangeStream.on("change", async (changeAppTracker) => {
  console.log(
    "line 315 AppTracker ChangeStream Start !!!!!!!!!!!!!!!!!! app id=",
    changeAppTracker.documentKey._id
  );

  // เมื่อมีการ insert ให้ ส่งเมลไปหาผู้อนุมัติ และupdate UI
  if (changeAppTracker.operationType === "insert") {
    console.log("line 324 appTracker have insert");
    if (changeAppTracker.fullDocument.approval_Status === "waiting") {
      console.log(
        "line 326 appTracker have insert and approval_Status = waiting"
      );
      

      //ไป update UI
      const findDocProgress = await DocumentProgressModel.findOne({
        _id: changeAppTracker.fullDocument.doc_Progress_ID,
      });
      const id_DocProgress = findDocProgress._id;
      const step_ID = changeAppTracker.fullDocument.step_ID;
      const findTrack = await TrackModel.findOne({
        doc_Progress_ID: id_DocProgress,
        step_ID: step_ID,
      });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log("send to Client from INSERT APPTRACKER");
          const jsonData = JSON.stringify({
            appTracker: changeAppTracker.fullDocument,
            // track:findTrack,
            docProgress: findDocProgress,
            type: "insert apptracker",
          });
          client.send(jsonData);
        }
      });

      //send email approval
      const approverID = changeAppTracker.fullDocument.approver_ID; //id คนอนุมัติ
      const approverInfo = await UserModel.findOne({ _id: approverID });
      const emailApprover = approverInfo.email;
      const docProgressID = changeAppTracker.fullDocument.doc_Progress_ID; //หา id docProgress
      const docProgress = await DocumentProgressModel.findOne({
        _id: docProgressID,
      });
      const flowInfo = await FlowModel.findOne({ _id: docProgress.flow_ID });
      const userID = docProgress.user_ID;
      const userInfo = await UserModel.findOne({ _id: userID });

      // สร้างวัตถุ moment จากค่าที่ได้รับมา
      const dateValue = moment(docProgress.dateTime_Create);
      dateValue.locale("th"); // กำหนดภาษาเป็นไทย
      const buddhistYear = dateValue.year() + 543;
      dateValue.year(buddhistYear);
      const formattedDate = dateValue.format(
        "วันddddที่ Do เดือนMMMM พ.ศ. YYYY เวลา HH:mm:ss น."
      );
      console.log("formattedDate =", formattedDate);
      
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_SERVER,
          pass: process.env.PASS_SERVER,
        },
      });
      const dataAddText = docProgress.data_Add_Text

      const formattedData = dataAddText.map((item) => {
        const { topic, type_Answer, answer } = item;
        if (type_Answer === "Date & Time" || type_Answer === "Date") {
          try {
            const momentDate = moment(answer);
            momentDate.locale("th");
            const buddhistYear = momentDate.year() + 543;
            momentDate.year(buddhistYear);
            const formattedDate = momentDate.format(
              "วันddddที่ Do MMMM พ.ศ. YYYY เวลา HH:mm:ss น."
            );
            return { topic, type_Answer, answer: formattedDate };
          } catch (error) {
            console.log("Error because:", error);
          }
        }
        return { topic, type_Answer, answer }; // คืนค่า item ที่ไม่ต้องการเปลี่ยนรูปแบบ
      });
      console.log("line 455 formattedData :",formattedData)
      const formattedDataString = formattedData.map(item => `${item.topic} : ${item.answer}`).join(", ");
      console.log("line 456 doc :",docProgress)

      const mailOption = {
        form: process.env.MAIL_SERVER,
        to: emailApprover,
        subject: `Auto Document Flow : ${flowInfo.flow_Name} ของ ${
          (userInfo.firstname+" "+userInfo.surname)
        }`,
        html: `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Template</title>
              <style>
                /* CSS styles for buttons */
                #approveButton, #rejectButton {
                  background-color: #4CAF50; /* สีพื้นหลัง */
                  border: none;
                  color: white;
                  padding: 10px 20px;
                  text-align: center;
                  text-decoration: none;
                  display: inline-block;
                  font-size: 16px;
                  margin: 4px 2px;
                  cursor: pointer;
                  border-radius: 4px;
                }

                #approveButton:hover {
                  background-color: #45a049; /* เปลี่ยนสีเมื่อเมาส์ผ่าน */
                }

                #rejectButton {
                  background-color: #f44336; /* สีพื้นหลัง */
                }

                #rejectButton:hover {
                  background-color: #d32f2f; /* เปลี่ยนสีเมื่อเมาส์ผ่าน */
                }
              </style>
            </head>
            <body>
              <p>ถึง ${(approverInfo.firstname+" "+approverInfo.surname)}</p>
              <p>คุณจะอนุมัติ เอกสารนี้หรือไม่</p>
              <form action="http://localhost:5000/api/approveDocumentFromEmail/${
                changeAppTracker.fullDocument._id
              }" method="POST">
                <input type="hidden" name="action" value="success">
                <button type="submit" id="approveButton">อนุมัติ</button>
              </form>

              <form action="http://localhost:5000/api/approveDocumentFromEmail/${
                changeAppTracker.fullDocument._id
              }" method="POST">
                <input type="hidden" name="action" value="fail">
                <button type="submit" id="rejectButton">ไม่อนุมัติ</button>
              </form>
              <p>รายละเอียด</p>
              <p>ประเภทเอกสาร :${flowInfo.flow_Name}</p>
              <p>ผู้ส่ง : ${(userInfo.firstname+" "+userInfo.surname)}</p>
              <p>วันที่-เวลาที่ส่งเอกสาร : ${formattedDate}</p>
              <p>${formattedDataString}</p>
              
            </body>
          </html>

        `,
        attachments: [
          {
            filename: `${
              flowInfo.flow_Name + userInfo.firstname + "_" + userInfo.surname
            }.pdf`,
            path: path.join(
              __dirname,
              "fileDocument",
              docProgress.name_Document_File
            ), // ตำแหน่งไฟล์ .pdf ในโฟลเดอร์ uploadsFile
            contentType: "application/pdf",
          },
          ...docProgress.data_Add_Other_File.map((item, index) => {
            const fileExtension = path.extname(item.file);
            let contentType = "";
            // กำหนด content type ของไฟล์ตามนามสกุล
            
            switch (fileExtension.toLowerCase()) {
              case ".png":
                contentType = "image/png";
                break;
              case ".jpg":
              case ".jpeg":
                contentType = "image/jpeg";
                break;
              case ".gif":
                contentType = "image/gif";
                break;
              // เพิ่ม case ตามนามสกุลไฟล์อื่นๆ ตามต้องการ
              default:
                // สำหรับนามสกุลไฟล์ที่ไม่รู้จักหรือไม่ได้ระบุ content type ให้ใช้ "application/octet-stream"
                contentType = "application/octet-stream";
            }
            return {
              filename: item.topic,
              path: path.join(__dirname, "otherFile", item.file),
              contentType: contentType,
            };
          }),
        ],
      };

      // <div>${formattedData
      //   .map(
      //     (item, index) =>
      //       `<div key=${index}>
      //       <p>${item.topic} : ${item.answer}</p>
      //     </div>`
      //   )
      //   .join("")}
      // </div>
      try {
        let info = await transporter.sendMail(mailOption);
        console.log(`Message sent by ${changeAppTracker.fullDocument._id}: %s`, info.messageId);
        console.log("Email sent for approval.");
        // res.send("Email sent for approval."); // ส่งคำตอบหลังจากส่งอีเมล์เรียบร้อยแล้ว
      } catch (error) {
        console.error("Error occurred while sending email:", error);
        // res.status(500).send("Error occurred while sending email.");
      }
    }
  } else if (changeAppTracker.operationType === "update") {
    const idAppTracker = changeAppTracker.documentKey._id;
    const findAppTracker = await AppTrackerModel.findOne({ _id: idAppTracker });

    const thaiDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    // ไป update Track เวลา กับ status
    const updateTrack = await TrackModel.findOneAndUpdate(
      {
        doc_Progress_ID: findAppTracker.doc_Progress_ID,
        step_ID: findAppTracker.step_ID,
      }, //find
      { status_Step: findAppTracker.approval_Status, date_Completed: thaiDate }, //update
      { new: true }
    );
    const newApprovalStatus =
      changeAppTracker.updateDescription.updatedFields.approval_Status;
    console.log(
      "findAppTracker.doc_Progress_ID :",
      findAppTracker.doc_Progress_ID
    );
    const docProgress = await DocumentProgressModel.findOne({
      _id: findAppTracker.doc_Progress_ID,
    });
    console.log("docProgress :", docProgress);
    const flowStep = await FlowStepModel.find({ flow_ID: docProgress.flow_ID });
    console.log("flowStepflowStep :", flowStep);
    // success
    if (newApprovalStatus === "success") {
      const newStep_ID = updateTrack.step_ID + 1;
      const newStepName = flowStep[newStep_ID].step_Type;

      console.log("NewnewStep_ID :", newStep_ID);
      let date_Completed;
      if (newStepName === "SendResponse") {
        date_Completed = thaiDate;
      } else {
        date_Completed = undefined; // หรืออาจจะกำหนดเป็น null ก็ได้ตามที่เหมาะสม
      }
      // INSERT เพิ่ม Track ใหม่
      const newTrack = new TrackModel({
        doc_Progress_ID: updateTrack.doc_Progress_ID,
        step_ID: newStep_ID,
        step_Name: newStepName,
        status_Step: newStepName === "SendResponse" ? "success" : "waiting",
        date_Completed:date_Completed
      });
      await newTrack.save();

      //update DocProgress
      const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
        { _id: updateTrack.doc_Progress_ID },
        {
          lastTime_Edit: thaiDate,
          current_State: newStep_ID, //+1
          doc_Status: newStepName === "SendResponse" ? "success" : "waiting",
        },
        { new: true }
      );
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log("send to Client from UPDATE APPTRACKER");
          const jsonData = JSON.stringify({
            appTracker: findAppTracker,
            docProgress: updateDocProgress,
            track: newTrack,
            type: "update apptracker",
            status: "succcess",
          });
          client.send(jsonData);
        }
      });

      //send email sender
      if(newStepName === "SendResponse"){
        const userInfo = await UserModel.findOne({_id:updateDocProgress.user_ID});
        const flowInfo = await FlowModel.findOne({_id:updateDocProgress.flow_ID});
        const emailUser = userInfo.email;
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.MAIL_SERVER,
            pass: process.env.PASS_SERVER,
          },
        });

        const mailOption = {
          form: process.env.MAIL_SERVER,
          to: emailUser,
          subject: `Auto Document Flow : ${flowInfo.flow_Name} ของคุณ อนุมัติแล้ว`,
          html:`
            <p>การส่ง ${flowInfo.flow_Name} อนุมัติสำเร็จ</p>
          `
          ,
          attachments : [
            {
              filename: `${flowInfo.flow_Name + userInfo.firstname + "_" + userInfo.surname}.pdf`,
              path: path.join(__dirname,"fileDocument",docProgress.name_Document_File),
              contentType: "application/pdf",
            },
          ]
        }
        try {
          let info = await transporter.sendMail(mailOption);
          console.log(`Message sent by : %s`, info.messageId);
          console.log("Email sent to user.");
          // res.send("Email sent for approval."); // ส่งคำตอบหลังจากส่งอีเมล์เรียบร้อยแล้ว
        } catch (error) {
          console.error("Error occurred while sending email:", error);
          // res.status(500).send("Error occurred while sending email.");
        }

      }

    } else if (newApprovalStatus === "fail") {
      //update DocProgress
      const updateDocProgress = await DocumentProgressModel.findOneAndUpdate(
        { _id: updateTrack.doc_Progress_ID },
        {
          lastTime_Edit: thaiDate,
          doc_Status: newApprovalStatus,
        },
        { new: true }
      );
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log("send to Client from UPDATE APPTRACKER");
          const jsonData = JSON.stringify({
            appTracker: findAppTracker,
            docProgress: updateDocProgress,
            track: updateTrack,
            type: "update apptracker",
            status: "fail",
          });
          client.send(jsonData);
        }
      });

      //send email sender
      const userInfo = await UserModel.findOne({_id:updateDocProgress.user_ID});
      const flowInfo = await FlowModel.findOne({_id:updateDocProgress.flow_ID});
      const emailUser = userInfo.email;
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_SERVER,
          pass: process.env.PASS_SERVER,
        },
      });

      const mailOption = {
        form: process.env.MAIL_SERVER,
        to: emailUser,
        subject: `Auto Document Flow : ${flowInfo.flow_Name} ของคุณ ถูกปฎิเสธ`,
        html:`
          <p>การส่ง ${flowInfo.flow_Name} ถูกปฎิเสธ</p>
        `
        ,
        attachments : [
          {
            filename: `${flowInfo.flow_Name + userInfo.firstname + "_" + userInfo.surname}.pdf`,
            path: path.join(__dirname,"fileDocument",docProgress.name_Document_File),
            contentType: "application/pdf",
          },
        ]
      }
      try {
        let info = await transporter.sendMail(mailOption);
        console.log(`Message sent by : %s`, info.messageId);
        console.log("Email sent to user.");
      } catch (error) {
        console.error("Error occurred while sending email:", error);
      }

    }
  }
});

//Api
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");
const UserModel = require("./model/userModel");

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

server.listen(port, () => {
  console.log(`Example server listen port ${port}`);
});
