const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    return cb(null, "fileDocument/");
  },
  filename: function (req, file, cb) {
    return cb(null, `doc_${Date.now()}_${file.originalname}`);
  },
});

const storageOtherFile = multer.diskStorage({
  destination: function (req, res, cb) {
    return cb(null, "otherFile/");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadFile = multer({ storage });
const uploadOtherFile = multer({ storage: storageOtherFile });
const UserModel = require("../model/userModel");
const RoleModel = require("../model/roleModel");
const PersonInRoleModel = require("../model/personInRoleModel");
const RelationshipGroupModel = require("../model/relationshipGroupModel");
const RelationshipGroupStepModel = require("../model/relationshipGroupStepModel");
const FlowModel = require("../model/flowModel");
const FlowStepModel = require("../model/flowStepModel");
const FavorDocFlowModel = require("../model/favorDocFlowModel");
const DocumentProgressModel = require("../model/documentProgressModel");
const TrackModel = require("../model/trackModel");
const AppTrackerModel = require("../model/appTrackerModel");

// Middleware to verify JWT

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      status: "Token error",
      message: "Access denied. No token provided.",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: "token error", message: "Invalid token." });
  }
};

app.get("/fetchRoles", verifyToken, async (req, res) => {
  try {
    // Use Mongoose to find all roles
    const roles = await RoleModel.find();
    res.json({ results: roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/fetchPersonFromRole", verifyToken, async (req, res) => {
  try {
    const { role_ID } = req.body;
    const listPerson = await PersonInRoleModel.find({ role_ID });
    if (!listPerson) return res.json({});

    const listUserID = listPerson.map((item, index) => item.user_ID);

    const listUsers = await UserModel.find({ _id: { $in: listUserID } });

    return res.json({ users: listUsers });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json(error);
  }
});

app.put("/updateRole/:id", verifyToken, async (req, res) => {
  try {
    const role_ID = req.params.id;
    const { role_Name, personToAdd } = req.body;

    //check Role_name ซ้ำ
    // const foundNameRepeat = await RoleModel.find({ role_Name: role_Name });
    // if (foundNameRepeat.length > 0) {
    //   return res.json({ status: "name repeat" });
    // }

    //Update(เพิ่ม) คนในrole ก่อน (ถ้าลบคนออกอีก Api)
    //insert PersonInRole (Many Document)
    const personInRolePromises = personToAdd.map(async (user_ID) => {
      const newPersonInRole = new PersonInRoleModel({
        role_ID: role_ID,
        user_ID: user_ID,
      });
      return await newPersonInRole.save();
    });

    // Wait for all inserts to complete
    await Promise.all(personInRolePromises);
    ///////
    const listPersons = await PersonInRoleModel.find({ role_ID: role_ID });
    const countNumberPersons = listPersons.length;

    //Update number_Of_People
    const updatedRole = await RoleModel.findOneAndUpdate(
      { _id: role_ID },
      { role_Name: role_Name, number_Of_People: countNumberPersons },
      { new: true }
    );

    return res.json({ updatedRole });
  } catch (error) {
    console.error("Error updating documents:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/deleteRole", verifyToken, async (req, res) => {
  const { roleToDelete } = req.body;

  //เช็คว่า role นี้อยู่ใน Role_Sender_ID กับ Role_Approval_ID หรือป่าว และอยู่ใน sub_Role_Sender_ID หรือป่าว

  const foundInRoleIsUsing = await RelationshipGroupModel.find({
    $or: [
      { role_Sender_ID: roleToDelete._id },
      { role_Approval_ID: roleToDelete._id },
    ],
  });
  const foundInRoleIsUsing2 = await RelationshipGroupStepModel.find({
    sub_Role_Sender_ID: roleToDelete._id,
  });
  if (foundInRoleIsUsing2.length > 0 || foundInRoleIsUsing.length > 0) {
    return res.json({ status: "can't delete role", msg: "Role is Using" });
  }

  //ลบคนใน role (PersonInRole), ลบ Roleใน (RoleModel),ถ้ามี mainRole find({_id:mainRole}) แล้วupdate ค่า role.sub_Role_List_ID
  if (roleToDelete.main_Role_ID) {
    // console.log("have Main")
    const mainRole = await RoleModel.findOne({
      _id: roleToDelete.main_Role_ID,
    });
    // Update sub_Role_List_ID ,pop roleToDelete._id ออกจากarray
    if (mainRole) {
      mainRole.sub_Role_List_ID = mainRole.sub_Role_List_ID.filter(
        (id) => id !== roleToDelete._id
      );
      await mainRole.save();
    }
  }
  // Delete PersonInRole
  await PersonInRoleModel.deleteMany({ role_ID: roleToDelete._id });
  // Delete the RoleModel
  await RoleModel.deleteOne({ _id: roleToDelete._id });

  const fetchAllRole = await RoleModel.find();
  res.json({
    status: "success",
    msg: "Role deleted successfully",
    newAllRole: fetchAllRole,
  });
});

app.post("/createRoleAndInsertPerson", verifyToken, async (req, res) => {
  const { role_Name, personToAdd } = req.body;

  try {
    //check Role_name ซ้ำ
    const foundNameRepeat = await RoleModel.find({ role_Name: role_Name });
    if (foundNameRepeat.length > 0) {
      return res.json({ status: "name repeat" });
    }

    //insert Role
    const newRole = new RoleModel({
      role_Name: role_Name,
      number_Of_People: personToAdd.length,
    });
    await newRole.save();

    //find newRole
    const newRoleFound = await RoleModel.findOne({ role_Name: role_Name });

    //insert PersonInRole (Many Document)
    const personInRolePromises = personToAdd.map(async (user_ID) => {
      const newPersonInRole = new PersonInRoleModel({
        role_ID: newRoleFound._id,
        user_ID: user_ID,
      });
      return await newPersonInRole.save();
    });

    // Wait for all inserts to complete
    await Promise.all(personInRolePromises);

    return res.json({
      status: "ok success",
      role_Name,
      number: personToAdd.length,
    });
  } catch (error) {
    console.error("Error create documents:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/createSubRoleAndUpdateMainRole", verifyToken, async (req, res) => {
  const { sub_role_Name, mainRole, selectPersonToAdd } = req.body;

  try {
    //check Role_name ซ้ำ
    const foundNameRepeat = await RoleModel.find({ role_Name: sub_role_Name });
    if (foundNameRepeat.length > 0) {
      return res.json({ status: "name repeat" });
    }

    //insert subRole
    const newSubRole = new RoleModel({
      role_Name: sub_role_Name,
      number_Of_People: selectPersonToAdd.length,
      main_Role_ID: mainRole._id,
    });
    await newSubRole.save();

    console.log(newSubRole);

    // Update mainRole
    const mainRoleUpdate = await RoleModel.findOneAndUpdate(
      { _id: mainRole._id },
      { $push: { sub_Role_List_ID: newSubRole._id } },
      { new: true }
    );

    console.log(mainRoleUpdate);

    //insert PersonInRole (Many Document)
    const personInRolePromises = selectPersonToAdd.map(async (user_ID) => {
      const newPersonInRole = new PersonInRoleModel({
        role_ID: newSubRole._id,
        user_ID: user_ID,
      });
      return await newPersonInRole.save();
    });

    // Wait for all inserts to complete
    await Promise.all(personInRolePromises);

    return res.json({
      status: "ok success",
      newSubRole,
      mainRoleUpdate,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/delUserFromMainRoleUpdate", verifyToken, async (req, res) => {
  //ต้องเพิ่มเงื่อนไขถ้า จะลบ "ผู้ใช้","ผู้ใช้"คนนั้นต้องไม่อยู่ใน subRole
  //และต้องไม่เป็น "ผู้อนุมัติ"
  const { listIdToDel, role_ID } = req.body;
  console.log("Delete Start")
  console.log("Body list delete =",listIdToDel)
  console.log("Role_ID =",role_ID)
  // console.log("list to Delete =",listIdToDel)
  const mainRole = await RoleModel.findOne({ _id: role_ID });
  if (mainRole?.sub_Role_List_ID?.length > 0) {
    //ถ้ามี subRole
    // console.log("have subRole =",mainRole.sub_Role_List_ID)
    const personInSubRole = await PersonInRoleModel.find({
      role_ID: { $in: mainRole.sub_Role_List_ID },
    });
    const listPersonInSubRole = personInSubRole.map((user) => user.user_ID);
    let cannotDeleteItems = [];
    for (let userIDToDelete of listIdToDel) {
      if (listPersonInSubRole.includes(userIDToDelete)) {
        // console.log("user in SubRole =",userIDToDelete)
        cannotDeleteItems.push(userIDToDelete);
      }
    }
    if (cannotDeleteItems.length > 0) {
      console.log("cannot del 1: ",cannotDeleteItems)
      return res.json({
        status: "can't delete",
        msg: "have user in SubRole",
        items: cannotDeleteItems,
      });
    }
  }


  //ก่อนเช็คหาผู้อนุมัติ ต้องเช็ค role อนุมัติด้วย
  //เช็คว่าเป็น "ผู้อนุมัติ" หรือไม่

  const listRelationshipGroup = await RelationshipGroupModel.find({role_Approval_ID: role_ID })
  const listRelationshipGroupID = listRelationshipGroup?._id //id rela group

  let cannotDeleteItems = [];
  for (let item of listIdToDel) {
    // console.log("item delete =",item)
    const approverExists = await RelationshipGroupStepModel.find({
      Approver_ID: item,relationship_ID : {$in: listRelationshipGroupID}
    });
    if (approverExists.length > 0) {
      console.log("have Approver :", approverExists);
      cannotDeleteItems.push(item);
    }
  }
  if (cannotDeleteItems.length > 0) {
    console.log("cannot del 2: ",cannotDeleteItems)
    return res.json({
      status: "can't delete",
      msg: "isApprover",
      items: cannotDeleteItems,
    });
  }

  // return res.json({status:"ok ไปต่อ",msg:"ไปกันต่อ"})
  try {
    // Delete documents where role_ID matches and user_ID is in the listIdToDel array
    const result = await PersonInRoleModel.deleteMany({
      role_ID: role_ID,
      user_ID: { $in: listIdToDel },
    });

    //Update
    const listPersons = await PersonInRoleModel.find({ role_ID: role_ID });
    const countNumberPersons = listPersons.length;
    //Update number_Of_People
    const updatedRole = await RoleModel.findOneAndUpdate(
      { _id: role_ID },
      { number_Of_People: countNumberPersons },
      { new: true }
    );

    return res.json({ status: "Delete Success", updatedRole });
  } catch (error) {
    console.error("Error deleting and updating documents:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//ไม่ใช้แล้ว
// app.post("/delUserFromSubRoleAndUpdate", verifyToken, async (req, res) => {
//   //ต้องเพิ่มเงื่อนไขถ้า จะลบ "ผู้ใช้",
//   //"ผู้ใช้" ต้องไม่เป็น "ผู้อนุมัติ"
//   try {
//   } catch (error) {
//     console.error("Error deleting and updating documents:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });

app.post("/fetchUserWithOutRole", verifyToken, async (req, res) => {
  const { listUserInRoleID } = req.body;
  const listUsersWithOutRole = await UserModel.find({
    _id: { $nin: listUserInRoleID },
  });
  return res.json({ users: listUsersWithOutRole });
});

app.post(
  "/fetchUserInMainRoleWithOutSubRole",
  verifyToken,
  async (req, res) => {
    const { listUserID, main_Role_ID } = req.body;

    const listPersonInMainRole = await PersonInRoleModel.find({
      role_ID: main_Role_ID,
    });
    const listUserIDInMainRole = listPersonInMainRole.map(
      (item) => item.user_ID
    );

    const usersNotInListUserID = listUserIDInMainRole.filter(
      (userID) => !listUserID.includes(userID)
    );
    const listUsersInMainRoleWithOutSubRole = await UserModel.find({
      _id: { $in: usersNotInListUserID },
    });
    return res.json({ users: listUsersInMainRoleWithOutSubRole });
  }
);

app.post("/createRelationshipGroup", verifyToken, async (req, res) => {
  const relationship_Name = req.body.nameRelationship;
  const role_Sender_ID = req.body.roleSender._id;
  const role_Approval_ID = req.body.roleApproval._id;
  try {
    const findNameRepeat = await RelationshipGroupModel.find({
      relationship_Name: relationship_Name,
    });
    if (findNameRepeat.length !== 0) {
      return res.status(201).json({ status: "repeat", check: findNameRepeat });
    }

    const newRelationship = new RelationshipGroupModel({
      relationship_Name,
      role_Sender_ID,
      role_Approval_ID,
    });
    const savedRelationship = await newRelationship.save();
    return res.status(201).json({ status: "ok", result: savedRelationship });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.get("/fetchRelationship", verifyToken, async (req, res) => {
  try {
    const relationshipGroups = await RelationshipGroupModel.find();
    res.json({ results: relationshipGroups, status: "ok" });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ status: "error", error: "Internal Server Error" });
  }
});

app.get("/fetchFlow", verifyToken, async (req, res) => {
  try {
    const allFlow = await FlowModel.find();
    res.json({ results: allFlow, status: "ok" });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ status: "error", error: "Internal Server Error" });
  }
});

app.post("/fetchDocFlowByUserID", verifyToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    const listDocFlow = await FlowStepModel.find({
      step_Type: "Initial",
      step_ID: 0,
    });

    let listOfDocFlow = [];

    // วน loop ใน listDocFlow
    for (const item of listDocFlow) {
      // ค้นหาใน PersonInRoleModel ว่ามี role_ID และ user_ID ตรงกับที่ต้องการหรือไม่
      const personInRole = await PersonInRoleModel.find({
        role_ID: item.user_Role_ID,
        user_ID: user_id,
      });

      // ถ้ามี role_ID และ user_ID ตรงกัน
      if (personInRole.length > 0) {
        // เก็บ flow_ID ไว้ใน listOfDocFlow
        listOfDocFlow.push(item.flow_ID);
      }
    }

    const results = await FlowModel.find({ _id: { $in: listOfDocFlow } });

    return res.json({ status: "success", results: results });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.post("/fetchFavDocFlowByIDUser", verifyToken, async (req, res) => {
  try {
    const { user_id } = req.body;

    const listFavDocFlow = await FavorDocFlowModel.find({ user_ID: user_id });
    console.log(listFavDocFlow, "...");
    const listFlowID = listFavDocFlow.map((item) => item.flow_ID);
    const results = await FlowModel.find({ _id: { $in: listFlowID } });

    return res.json({ status: "success", results: results });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

async function fetchNewFavDocFlow({ user_ID }) {
  const listFavDocFlow = await FavorDocFlowModel.find({ user_ID });
  console.log(listFavDocFlow, "...");
  const listFlowID = listFavDocFlow.map((item) => item.flow_ID);
  const results = await FlowModel.find({ _id: { $in: listFlowID } });

  return results;
}

app.post("/insertFavDocFlow", async (req, res) => {
  try {
    const { doc_ID, user_ID } = req.body;
    const favorDocFlow = new FavorDocFlowModel({
      user_ID: user_ID,
      flow_ID: doc_ID,
    });

    // Save the instance to the database
    await favorDocFlow.save();

    //
    const listFavDocFlow = await FavorDocFlowModel.find({ user_ID });
    console.log(listFavDocFlow, "...");
    const listFlowID = listFavDocFlow.map((item) => item.flow_ID);
    const results = await FlowModel.find({ _id: { $in: listFlowID } });

    return res.json({ status: "success", newResults: results });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.post("/delFavDocFlow", async (req, res) => {
  try {
    const { doc_ID, user_ID } = req.body;

    const deletedDocument = await FavorDocFlowModel.findOneAndDelete({
      flow_ID: doc_ID,
      user_ID: user_ID,
    });
    console.log("del fav doc", deletedDocument);
    //
    const listFavDocFlow = await FavorDocFlowModel.find({ user_ID });
    console.log(listFavDocFlow, "...");
    const listFlowID = listFavDocFlow.map((item) => item.flow_ID);
    const results = await FlowModel.find({ _id: { $in: listFlowID } });
    return res.json({ status: "success", newResults: results });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.post("/findUserByRoleID", verifyToken, async (req, res) => {
  try {
    const { role_Approval_ID } = req.body;
    const personInRoleApproval = await PersonInRoleModel.find({
      role_ID: role_Approval_ID,
    });
    const listPersonInRoleApproval = personInRoleApproval.map(
      (user) => user.user_ID
    );
    const approversInfo = await UserModel.find({
      _id: { $in: listPersonInRoleApproval },
    });
    return res.json({ results: approversInfo });
  } catch (error) {
    console.log(`findUserByRoleID error : ${error}`);
  }
});

app.post("/saveRelationshipStep", verifyToken, async (req, res) => {
  const { listData, relationship_ID } = req.body;

  try {
    const checkData = listData.map((item, index) => {
      if (item.sub_Role_Sender_ID === "" || item.Approver_ID === "") {
        return { status: "error" };
      } else {
        return { status: "ok" };
      }
    });

    if (checkData.some((item) => item.status === "error")) {
      return res.json({
        status: "can't save",
        errors: checkData.filter((item) => item.status === "error"),
      });
    }

    await RelationshipGroupStepModel.deleteMany({
      relationship_ID: relationship_ID,
    });

    console.log(listData);
    await RelationshipGroupStepModel.insertMany(listData);
    return res.json({ status: "save" });
  } catch (error) {
    console.log(`saveRelationshipStep error : ${error}`);
    return res.json({ status: "catch error" });
  }
});

app.post("/fetchRelationshipInfoByID", verifyToken, async (req, res) => {
  const { relationship_ID } = req.body;
  try {
    const result = await RelationshipGroupModel.findOne({
      _id: relationship_ID,
    });

    return res.json({ result: result });
  } catch (error) {
    console.log(error);
  }
});

app.post("/fetchRelationshipByID", verifyToken, async (req, res) => {
  const { relationship_ID } = req.body;
  try {
    const result = await RelationshipGroupStepModel.find({ relationship_ID });
    return res.json({ results: result });
  } catch (error) {
    console.log(`fetchRelationshipByID error: ${error}`);
    return res.status(500).json({ status: "internal server error" });
  }
});

app.post("/fetchFlowStepByID", verifyToken, async (req, res) => {
  const { flow_ID } = req.body;
  try {
    const result = await FlowStepModel.find({ flow_ID: flow_ID });
    // console.log(result);
    return res.json({ results: result });
  } catch (error) {
    console.log(`fetchFlowStepByID error: ${error}`);
    return res.status(500).json({ status: "internal server error" });
  }
});

app.post("/fetchFlowInfoByFlowID", verifyToken, async (req, res) => {
  const { flow_ID } = req.body;
  try {
    const result = await FlowModel.findOne({ _id: flow_ID });
    return res.json({ results: result });
  } catch (error) {
    console.log(`fetchFlowInfoByID error: ${error}`);
    return res.status(500).json({ status: "internal server error" });
  }
});

app.post("/changeRelationshipInfo", verifyToken, async (req, res) => {
  const { id, newName, newRoleSenderID, newRoleApprovalID } = req.body;
  try {
    // console.log("newRoleSenderID",newRoleSenderID)
    // console.log("newRoleApprovalID",newRoleApprovalID)
    const updatedRelationshipGroup =
      await RelationshipGroupModel.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            relationship_Name: newName,
            role_Sender_ID: newRoleSenderID,
            role_Approval_ID: newRoleApprovalID,
          },
        },
        { new: true } // Set to true to return the modified document instead of the original
      );

    //delete by relationship_id:id doc ทั้งหมด
    await RelationshipGroupStepModel.deleteMany({
      relationship_ID: id,
    });
    return res.json({
      status: "ok",
      updateRelationshipInfo: updatedRelationshipGroup,
    });
  } catch (error) {
    console.log("Error :", error);
  }
});

app.post("/changeFlowName", verifyToken, async (req, res) => {
  const { id, newFlowName } = req.body;

  try {
    const updatedFlowInfo = await FlowModel.findOneAndUpdate(
      { _id: id },
      { flow_Name: newFlowName },
      { new: true } // Set to true to return the modified document instead of the original
    );
    return res.json({
      status: "ok",
      updateFlow: updatedFlowInfo,
    });
  } catch (error) {
    console.log("Error :", error);
    return res.json({ status: "error" });
  }
});

app.post("/changeRelationshipName", verifyToken, async (req, res) => {
  const { id, newName } = req.body;
  try {
    const updatedRelationshipGroup =
      await RelationshipGroupModel.findOneAndUpdate(
        { _id: id },
        { relationship_Name: newName },
        { new: true } // Set to true to return the modified document instead of the original
      );
    return res.json({
      status: "ok",
      updateRelationship: updatedRelationshipGroup,
    });
  } catch (error) {
    console.log("Error :", error);
  }
});

function isValidInputToCreateFlow(add_Text, add_Other_File) {
  if (add_Text.some((item) => item.topic === "" || item.type_Answer === "")) {
    return false;
  }
  if (add_Other_File.some((item) => item.topic === "")) {
    return false;
  }
  return true;
}

app.post("/createAndInitialFlow", verifyToken, async (req, res) => {
  const { flow_Name, user_Role_ID, add_Text, add_Other_File } = req.body;

  //check condition  ก่อน

  if (!isValidInputToCreateFlow(add_Text, add_Other_File)) {
    return res.json({
      status: "false",
    });
  }
  if (user_Role_ID.length === 0 || user_Role_ID === "") {
    return res.json({
      status: "false",
    });
  }
  try {
    const existingFlow = await FlowModel.findOne({ flow_Name: flow_Name });
    if (existingFlow) {
      return res.json({
        status: "repeat",
      });
    }

    const role = await RoleModel.findOne({ _id: user_Role_ID });
    console.log("roleName=", role);
    const label = role.role_Name;

    const newFlow = new FlowModel({
      flow_Name: flow_Name,
      all_Order_Of_Sender_Role_ID: [{ value: user_Role_ID, label: label }],
    });
    await newFlow.save();

    //find newFlow ID
    const newFlowFound = await FlowModel.findOne({ flow_Name: flow_Name });
    const flow_ID = newFlowFound._id;

    const newFlowStep = new FlowStepModel({
      flow_ID: flow_ID,
      step_ID: 0,
      step_Type: "Initial",
      user_Role_ID: user_Role_ID,
      add_Text: add_Text,
      add_Other_File: add_Other_File,
    });
    await newFlowStep.save();

    const newFlowStepAddAction = new FlowStepModel({
      flow_ID: flow_ID,
      step_ID: 1,
      step_Type: "AddAction",
    });
    await newFlowStepAddAction.save();

    return res.json({
      status: "ok",
      newFlow: newFlow,
      newFlowStep: newFlowStep,
    });
  } catch (error) {
    console.log("Catch Error :", error);
    return res.json({ status: "error", msg: error });
  }
});

app.post("/updateFlow", verifyToken, async (req, res) => {
  const { allFlowStep, listOrderOfSender, flow_ID } = req.body;
  console.log(allFlowStep);
  //check
  if (listOrderOfSender.length === 0) {
    return res.json({ status: "fail" });
  }
  if (
    !isValidInputToCreateFlow(
      allFlowStep[0].add_Text,
      allFlowStep[0].add_Other_File
    )
  ) {
    return res.json({
      status: "false",
    });
  }
  try {
    const insertedFlowSteps = [];

    for (const item of allFlowStep) {
      // เงื่อนไขหลัก 1
      if (
        item.step_Type === "Initial" &&
        item.step_ID === 0 &&
        !item.user_Role_ID
      ) {
        return res.json({ status: "fail" });
      }

      // เงื่อนไขหลัก 2
      if (item.step_Type === "Approval") {
        // เงื่อนไขย่อย 1
        if (!item.role_Approver_ID) {
          return res.json({ status: "fail" });
        }

        // เงื่อนไขย่อย 2
        if (
          !item.relationship_ID &&
          item.role_Approver_ID &&
          (!item.is_User_Select || !item.topic_Send_To_Approve)
        ) {
          return res.json({ status: "fail" });
        }

        // เงื่อนไขย่อย 3
        if (
          item.relationship_ID &&
          item.role_Approver_ID &&
          !listOrderOfSender
        ) {
          return res.json({ status: "fail" });
        }
      }
    }

    await FlowStepModel.deleteMany({
      flow_ID: flow_ID,
    });

    const updateFlowInfo = await FlowModel.updateOne(
      { _id: flow_ID },
      { $set: { all_Order_Of_Sender_Role_ID: listOrderOfSender } }
    );

    for (const item of allFlowStep) {
      let insertData = {};

      // เช็ค step_Type เพื่อเตรียมข้อมูลสำหรับการ insert
      switch (item.step_Type) {
        case "Initial":
          if (item.step_ID === 0 && !item.user_Role_ID) {
            return res.json({ status: "fail" });
          }
          insertData = {
            flow_ID: flow_ID,
            step_ID: item.step_ID,
            step_Type: item.step_Type,
            user_Role_ID: item.user_Role_ID,
            add_Text: item.add_Text || [],
            add_Other_File: item.add_Other_File || [],
          };
          break;
        case "Approval":
          if (
            !item.role_Approver_ID ||
            (!item.relationship_ID &&
              (!item.is_User_Select || !item.topic_Send_To_Approve)) ||
            (item.relationship_ID && !listOrderOfSender)
          ) {
            return res.json({ status: "fail" });
          }
          insertData = {
            flow_ID: flow_ID,
            step_ID: item.step_ID,
            step_Type: item.step_Type,
            relationship_ID: item.relationship_ID || "",
            role_Approver_ID: item.role_Approver_ID,
            is_User_Select: item.is_User_Select || "",
            topic_Send_To_Approve: item.topic_Send_To_Approve || "",
            order_Of_Sender_Role_ID: item?.order_Of_Sender_Role_ID,
          };
          break;
        case "SendResponse":
          insertData = {
            flow_ID: flow_ID,
            step_ID: item.step_ID,
            step_Type: item.step_Type,
          };
          break;
        case "AddAction":
          insertData = {
            flow_ID: flow_ID,
            step_ID: item.step_ID,
            step_Type: item.step_Type,
          };
          break;
        default:
          return res.json({ status: "fail" });
      }

      // insert ข้อมูลใน FlowStepModel
      const insertedStep = await FlowStepModel.create(insertData);
      console.log("กำลังบันทึก", insertedStep);

      // เก็บข้อมูลที่ insert ไว้
      insertedFlowSteps.push(insertedStep);
    }

    return res.json({
      status: "success",
      updateOrderOfSender: updateFlowInfo,
      updateFlowStep: insertedFlowSteps,
    });
  } catch (error) {
    console.log("catch Error :", error);
    return res.json({ status: "error" });
  }
});

app.post(
  "/fetchRoleApprovalByRelationshipID",
  verifyToken,
  async (req, res) => {
    const { relationship_ID } = req.body;
    try {
      const relationship_group_step = await RelationshipGroupStepModel.find({
        relationship_ID: relationship_ID,
      });
      console.log(relationship_group_step);
      const list_role2_ID = [
        ...new Set(relationship_group_step.map((item, index) => item.role2_ID)),
      ];
      console.log("list_role2_ID :", list_role2_ID);

      return res.json({ list_role2_ID: list_role2_ID });
    } catch (error) {
      console.log("catch Error :", error);
      return res.json({ status: "error" });
    }
  }
);

app.post(
  "/fetchRoleSenderAndRoleApprovalByRelID",
  verifyToken,
  async (req, res) => {
    const { rel_ID } = req.body;
    try {
      const relationshipInfo = await RelationshipGroupModel.findOne({
        _id: rel_ID,
      });

      const roleSenderInfo = await RoleModel.findOne({
        _id: relationshipInfo?.role_Sender_ID,
      });
      return res.json({
        status: "ok",
        roleSenderInfo: roleSenderInfo,
        role_Approval_ID: relationshipInfo?.role_Approval_ID,
      });
    } catch (error) {
      return res.json({ status: "error", msg: error });
    }
  }
);

app.get("/fetchAllUserInfo", verifyToken, async (req, res) => {
  try {
    const allUserInfo = await UserModel.find();
    return res.json({ status: "ok", results: allUserInfo });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.get("/fetchAllPersonInRole", verifyToken, async (req, res) => {
  try {
    const personInRole = await PersonInRoleModel.find();
    return res.json({ status: "ok", results: personInRole });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.post("/sendDocumentProgress", verifyToken, async (req, res) => {
  try {
    const {
      flow_ID,
      user_ID,
      flowStep,
      document_File,
      sending_Doc_Name,
      dateTime_Create,
      data_Add_Text,
      data_Add_Other_File,
      data_User_Select_Approver,
    } = req.body;

    const total_State = flowStep.length; //อาจจะกลับมา-1
    // console.log("user_ID -",user_ID)
    const newDocumentProgress = await DocumentProgressModel.create({
      user_ID: user_ID,
      flow_ID: flow_ID,
      sending_Doc_Name: sending_Doc_Name,
      dateTime_Create: dateTime_Create,
      lastTime_Edit: dateTime_Create, //update
      doc_Status: "waiting", //update
      total_State: total_State,
      current_State: 0, //update
      name_Document_File: document_File,
      data_Add_Text: data_Add_Text,
      data_Add_Other_File: data_Add_Other_File,
      data_User_Select_Approver: data_User_Select_Approver,
      sender_Order: [user_ID], //update
    });

    console.log("New Document Progress:", newDocumentProgress);

    const newTrack = new TrackModel({
      doc_Progress_ID: newDocumentProgress._id,
      step_ID: newDocumentProgress.current_State,
      step_Name: flowStep[newDocumentProgress.current_State]?.step_Type,
      // date_Completed: , //update
      status_Step: "waiting", //update
    });
    await newTrack.save(); // เปิด Change Stream สำหรับ Collection 'track'

    return res.json({ status: "ok" });
  } catch (error) {
    console.log(error);
    return res.json({ status: "error", msg: error });
  }
});

app.post("/uploadAndCreateDocFileName",uploadFile.single("docFile"),async (req, res) => {
    // console.log(req.file)
    const file = req.file;
    const fileName = file.filename;
    return res.json({ fileName: fileName });
  }
);

app.post(
  "/createOtherFileName",
  uploadOtherFile.single("file"),
  async (req, res) => {
    // console.log(req.file)
    const file = req.file;
    const fileName = file.filename;
    return res.json({ fileName: fileName });
  }
);

app.post("/fetchDocumentProgressByUserID", verifyToken, async (req, res) => {
  const { user_ID } = req.body;
  if (!user_ID) {
    return res.json({ status: "error", msg: "not found userID" });
  }
  try {
    const allProgress = await DocumentProgressModel.find({ user_ID: user_ID });

    return res.json({ status: "ok", docProgress: allProgress });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.post("/fetchAppTrackerByApprovalID", verifyToken, async (req, res) => {
  const { approver_ID } = req.body;
  if (!approver_ID) {
    return res.json({ status: "error", msg: "not found approverID" });
  }
  try {
    const allAppovalTracker = await AppTrackerModel.find({
      approver_ID: approver_ID,
    });
    const listDocProgressID = allAppovalTracker.map(
      (item) => item.doc_Progress_ID
    );
    const listDocProgressInfo = await DocumentProgressModel.find({
      _id: { $in: listDocProgressID },
    });
    return res.json({
      status: "ok",
      listDocProgressInfo,
      approvalTracker: allAppovalTracker,
    });
  } catch (error) {
    return res.json({ status: "error", msg: error });
  }
});

app.get("/fetchTrack", verifyToken, async (req, res) => {
  try{
    const allTrack = await TrackModel.find()
    return res.json({status: "ok",results: allTrack})
  }catch(error){
    return res.json({ status: "error", msg: error });
  }
})

app.post("/approveDocument", async (req, res) => {
  const { approval_Status, updateApproverTracker } = req.body;

  try{
    const updateAppTracker = await AppTrackerModel.findOneAndUpdate(
      { _id: updateApproverTracker._id },
      { approval_Status: approval_Status },
      { new: true }
    );
    return res.json({status:"ok",update:approval_Status})
  }catch(error){
    console.log(error)
    return res.json({status:"error",msg:error})
  }
});

app.post("/approveDocumentFromEmail/:appTrackerID", async (req, res) => {
  const { appTrackerID } = req.params; //ไอดีappTracker
  
  const { action } = req.body; //ค่าอนุมัติ
  console.log("appTrackerID :", appTrackerID);
  console.log("Action =",action)
  console.log("Body :",req.body)
  if(!appTrackerID || !action){
    return res.json("Not found")
  }
  
  const findAppTracker = await AppTrackerModel.findOne({_id:appTrackerID});
  if(findAppTracker.approval_Status === "waiting" ){
    if(action === "success"){
      findAppTracker.approval_Status = "success";
      await findAppTracker.save();
      return res.json("อนุมัติสำเร็จ")
    }else if(action === 'fail'){
      findAppTracker.approval_Status = "fail";
      await findAppTracker.save();
      return res.json("ปฏิเสธการอนุมัติสำเร็จ");
    }
    
  }else{
    return res.json("ไม่สามารถอนุมัติได้แล้ว เพราะมีการอนุมัติแล้ว")
  }
  
})

app.post("/fetchDocProgressByID",verifyToken,async(req,res) => {
  const {docProgress_ID} =req.body;
  if(!docProgress_ID)return res.json({status:"error",msg:"not found id"})

  try{
    const docProgress = await DocumentProgressModel.findOne({_id:docProgress_ID})
    return res.json({status : "ok",result:docProgress})
  }catch(error){
    console.log(error)
    res.json({status:"error",msg:error})
  }
})


module.exports = app;
