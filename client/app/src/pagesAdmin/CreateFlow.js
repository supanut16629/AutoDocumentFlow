import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styleCss/FlowStyle.css";
import "../styleCss/MyStyle.css";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import axios from "axios";

import { RxText } from "react-icons/rx";
import { GoFile } from "react-icons/go";
import { ImCross } from "react-icons/im";

function CreateFlow() {
  const navigate = useNavigate();
  const [flowName, setFlowName] = useState("");
  // const [selectRelationshipID, setSelectRelationshipID] = useState("");
  const [selectUserRoleID, setSelectUserRoleID] = useState("");
  const [addText, setAddText] = useState([]);
  const [addFile, setAddFile] = useState([]);
  const [stepInit, setStepInit] = useState(1);
  //ข้อมูลในการ Init

  // const [allRelationship, setAllRelationship] = useState([]);
  const [allRole,setAllRole] = useState([])
  const [allTypeAnswer, setAllTypeAnswer] = useState([
    { label: "ข้อความ", value: "Text" },
    { label: "วันที่", value: "Date" },
    { label: "วัน เวลา", value: "Date & Time" },
  ]);

  async function ChangeNextStep() {
    //check null name
    if (flowName.trim() === "") {
      return alert("กรุณาใส่ชื่อ");
    }
    setStepInit(2);
  }

  function ChangePrevStep() {
    setStepInit(1);
  }

  const handleChangeDropdownRole = (event) => {
    setSelectUserRoleID(event.target.value);
  };

  function handleAddText() {
    setAddText([...addText, { topic: "", type_Answer: "" }]);
  }

  function handleAddFile() {
    setAddFile([...addFile, { topic: "" }]);
  }

  function handleChangeTopicAddText(index, event) {
    const newAddText = [...addText];
    newAddText[index].topic = event.target.value;
    setAddText(newAddText);
  }

  function handleChangeTypeAnswerAddText(index, event) {
    const newAddText = [...addText];
    newAddText[index].type_Answer = event.target.value;
    setAddText(newAddText);
  }

  function handleChangeTopicAddFile(index, event) {
    const newAddFile = [...addFile];
    newAddFile[index].topic = event.target.value;
    setAddFile(newAddFile);
  }

  function handleDelAddText(index) {
    const newAddText = [...addText];
    newAddText.splice(index, 1);
    setAddText(newAddText);
  }

  function handleDelAddFile(index) {
    const newAddFile = [...addFile];
    newAddFile.splice(index, 1);
    setAddFile(newAddFile);
  }

  async function initialFlow() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.post(
        "http://localhost:5000/api/createAndInitialFlow",
        {
          flow_Name:flowName,
          // relationship_ID:selectRelationshipID,
          user_Role_ID:selectUserRoleID,
          add_Text:addText,
          add_Other_File:addFile,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );

      const status = response.data.status
      if(status === "ok"){
        // console.log(response.data.newFlow)
        // console.log(response.data.newFlowStep)
        const id = response.data.newFlow._id
        const name = response.data.newFlow.flow_Name
        navigate(`/admin/myFlow/${id}?name=${name}`);
        //navigate
      }else if(status === "false"){
        alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      }else if(status === "repeat"){
        alert("ชื่อFlowซ้ำ กรุณาเปลี่ยนชื่อ")
      }
    } catch (error) {
      console.error("Error initialFlow:", error);
    }
    //ข้อมูลที่ต้องส่งไป Initial
    // flow_Name:flowName,
    // step_ID: 0, เริ่มต้น ไม่ต้องส่งไปก็ได้
    // step_Type: Initial, ไม่ต้องส่งไปก็ได้
    // user_Role_ID : Roleของผู้ที่สามารถใช้งานเอกสารได้
    // add_Text: addText,
    // add_Other_File : addFile
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  useEffect(() => {
    async function fetchAllRole() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchRoles",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        console.log(response.data.results);
        const results = response.data.results;

        if (!isEqual(results, allRole)) {
          // Update state only if the data is different
          setAllRole(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchAllRole();
  }, [allRole]);
  return (
    <div>
      <div className="container-create-flow">
        {stepInit === 1 ? (
          <div className="frame-create-flow">
            <u>
              <h1>สร้างFlowเอกสาร</h1>
            </u>
            <div className="sub-frame-create-flow">
              <p>ชื่อเอกสาร</p>
              <input
                type="text"
                required
                placeholder="ชื่อเอกสารที่ต้องการ"
                value={flowName}
                onChange={(event) => setFlowName(event.target.value)}
              />
              <div className="group-btn">
                <button onClick={() => ChangeNextStep()}>ถัดไป</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="frame-create-flow">
            <u>
              <h1>ชื่อเอกสาร: {flowName}</h1>
            </u>

            <div className="pd1">
              <h2>เลือกRoleที่ต้องการให้ใช้เอกสาร</h2>
              <div className="pdt1">
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    เลือกRoleที่ต้องการให้ใช้เอกสาร
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectUserRoleID}
                    label="Role"
                    onChange={handleChangeDropdownRole}
                  >
                    {allRole.map((item, index) => {
                      return (
                        <MenuItem key={index} value={item._id}>
                          {item.role_Name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="pd1">
              <h2>เพิ่มรายละเอียดที่เอกสารต้องการ</h2>
              <div className="flex-row mg1">
                <button
                  className={
                    addText.length !== 0
                      ? "btn-add-text-selected"
                      : "btn-add-text"
                  }
                  onClick={() => handleAddText()}
                >
                  <div>
                    <RxText className="font-25" />
                  </div>
                  <div>เพิ่มข้อความ</div>
                </button>
                <button
                  className={
                    addFile.length !== 0
                      ? "btn-add-text-selected"
                      : "btn-add-text"
                  }
                  onClick={() => handleAddFile()}
                >
                  <div>
                    <GoFile className="font-25" />
                  </div>
                  <div>เพิ่มไฟล์อื่นๆ</div>
                </button>
              </div>
              {addText.map((item, index) => {
                return (
                  <div className="box-input-add-more" key={index}>
                    <div className="box1">
                      <p>เพิ่มข้อความ</p>
                      <ImCross
                        size={13}
                        className="icon-del"
                        onClick={() => handleDelAddText(index)}
                      />
                    </div>

                    <div className="topic-add-more">
                      <p>ระบุหัวข้อที่ต้องการ :</p>
                      <input
                        type="text"
                        required={true}
                        placeholder="ระบุหัวข้อที่ต้องการ"
                        value={item.topic}
                        onChange={(event) =>
                          handleChangeTopicAddText(index, event)
                        }
                      />
                    </div>
                    <div className="topic-add-more">
                      <p>ระบุประเภทคำตอบ :</p>
                      <select
                        className="dropdown"
                        value={item.type_Answer || ""}
                        onChange={(event) =>
                          handleChangeTypeAnswerAddText(index, event)
                        }
                      >
                        <option value="" disabled>
                          เลือกประเภทคำตอบ
                        </option>
                        {allTypeAnswer.map((type, typeIndex) => (
                          <option key={typeIndex} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              {addFile.map((item, index) => {
                return (
                  <div className="box-input-add-more" key={index}>
                    <div className="box1">
                      <p>เพิ่มไฟล์อื่นๆ</p>{" "}
                      <ImCross
                        size={13}
                        className="icon-del"
                        onClick={() => handleDelAddFile(index)}
                      />
                    </div>

                    <div className="topic-add-more">
                      <p>ระบุหัวข้อที่ต้องการ :</p>
                      <input
                        type="text"
                        required={true}
                        placeholder="ระบุหัวข้อที่ต้องการ"
                        value={item.topic}
                        onChange={(event) =>
                          handleChangeTopicAddFile(index, event)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="group-btn-next-prev">
              <button className="btn-prev" onClick={() => ChangePrevStep()}>
                ย้อนกลับ
              </button>
              <button
                className="btn-next"
                onClick={() => initialFlow()}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateFlow;
