import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoDocumentTextOutline } from "react-icons/io5";
import { IoCloseSharp } from "react-icons/io5";
import { MdUpload } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import { format } from 'date-fns';
const OverlaySendDoc = ({ docInfo, onClose }) => {
  const [docFlowStep, setDocFlowStep] = useState([]); //ดึงข้อมูลมาดู

  const [newTaskName, setNewTaskName] = useState(""); //ตั้งค่าชื่อการส่งเอกสาร
  const [selectedFile, setSelectedFile] = useState(null); //เก็บ file pdf
  const [previewPDF, setPreviewPDF] = useState(null); //เอาไว้แสดงเฉยๆ
  const [textFromUser, setTextFromUser] = useState([]);
  const [selectedOtherFile, setSelectedOtherFile] = useState([]);
  const [dataUserSelectApprover, setDataUserSelectApprover] = useState([]);
  const [allUserInfo, setAllUserInfo] = useState([]);
  const [allPersonInRole, setAllPersonInRole] = useState([]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log(file);
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const fileURL = URL.createObjectURL(file);
      setPreviewPDF(fileURL);
    } else {
      setSelectedFile(null);
      setPreviewPDF(null);
      alert("Please select a PDF file.");
    }
  };

  const handleSendInfoDocument = async () => {
    console.log("ข้อมูลเอกสาร :", docInfo);
    if (!newTaskName) {
      return alert("กรุณาใส่ชื่อการส่งเอกสาร");
    } else if (!selectedFile) {
      return alert("กรุณาเลือกไฟล์");
    } else if (textFromUser.some((item) => item.answer === "")) {
      return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    } else if (selectedOtherFile.some((item) => item.file === "")) {
      return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    if (
      Array.isArray(dataUserSelectApprover) &&
      dataUserSelectApprover.length > 0
    ) {
      // วน loop เพื่อตรวจสอบค่า approver_ID ในแต่ละ Object
      for (const item of dataUserSelectApprover) {
        // ถ้า approver_ID เป็นสตริงว่าง ให้แสดง alert และออกจาก function
        if (item.approver_ID === "") {
          return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        }
      }
    }
    console.log("selectedOtherFile : ",selectedOtherFile)
    try {
      // ส่งข้อมูลไปที่ API
      let fileNameInFolder;
      let arrayOtherFile = [];
      const formDocFile = new FormData();
      formDocFile.append("docFile", selectedFile);

      await axios
        .post(
          "http://localhost:5000/api/uploadAndCreateDocFileName",
          formDocFile
        )
        .then((res) => res.data)
        .then((data) => {
          fileNameInFolder = data.fileName;
        });
      if (selectedOtherFile.length !== 0) {
        await Promise.all(
          selectedOtherFile.map(async (item) => {
            const formFile = new FormData();
            formFile.append("file", item.file);

            // ส่งไฟล์อื่นๆ ไปที่ API และรอรับชื่อไฟล์กลับมา
            const response = await axios.post(
              "http://localhost:5000/api/createOtherFileName",
              formFile
            );

            // เพิ่มข้อมูลไฟล์ที่ส่งไปใน arrayOtherFile
            arrayOtherFile.push({
              topic: item.topic,
              file: response.data.fileName,
            });
          })
        );
      }
      const thaiDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
      // const formattedThaiDate = format(new Date(thaiDate), "MMMM d, yyyy 'at' h:mm aa");
      const userData = JSON.parse(localStorage.getItem("userData"));
      const response = await axios.post(
        "http://localhost:5000/api/sendDocumentProgress",
        {
          flow_ID:docInfo._id,
          flowStep:docFlowStep,
          document_File:fileNameInFolder,
          user_ID:userData.data._id,
          sending_Doc_Name:newTaskName,
          dateTime_Create:thaiDate,
          data_Add_Text:textFromUser,
          data_Add_Other_File:arrayOtherFile,
          data_User_Select_Approver:dataUserSelectApprover
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );

      // ปิด Component นี้
      alert("สำเร็จ");
      onClose();
      return;
    } catch (error) {
      console.log("เกิดข้อผิดพลาดในการส่งข้อมูล:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  const handlePopFile = (event, index) => {
    setSelectedOtherFile((prevState) => {
      const updatedOtherFile = [...prevState];
      updatedOtherFile[index].file = "";
      // console.log("updateOtherFile", updatedOtherFile);
      return updatedOtherFile;
    });
  };

  const handleOtherFileChange = (event, index) => {
    const file = event.target.files[0];
    // console.log(file);
    setSelectedOtherFile((prevState) => {
      const updatedOtherFile = [...prevState];
      updatedOtherFile[index].file = file;
      console.log("updateOtherFile", updatedOtherFile);
      return updatedOtherFile;
    });
  };

  const handleDateChange = (date, index) => {
    console.log(typeof date, date);
    setTextFromUser((prevState) => {
      const updatedTextFromUser = [...prevState];
      updatedTextFromUser[index].answer = date; // กำหนดค่าวันที่ใหม่
      return updatedTextFromUser;
    });
  };

  const handleDateTimeChange = (dateTime, index) => {
    console.log(typeof dateTime, dateTime);
    setTextFromUser((prevState) => {
      const updatedTextFromUser = [...prevState];
      updatedTextFromUser[index].answer = dateTime; // กำหนดค่าวันที่และเวลาใหม่
      return updatedTextFromUser;
    });
  };

  const handleInputChange = (e, index) => {
    const { value } = e.target;
    setTextFromUser((prevState) => {
      const updatedTextFromUser = [...prevState];
      updatedTextFromUser[index].answer = value;
      return updatedTextFromUser;
    });
  };

  const handleChangeApprover = (data, event) => {
    const value = event.target.value;
    const dataIndex = dataUserSelectApprover.findIndex(
      (dt) => dt.step_ID === data.step_ID
    );
    setDataUserSelectApprover((prevData) => {
      const updateData = [...prevData];
      updateData[dataIndex] = {
        ...updateData[dataIndex],
        approver_ID: value,
      };
      return updateData;
    });
  };
  // flowStep
  useEffect(() => {
    async function fetchInfoDocFlowStep() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.post(
          "http://localhost:5000/api/fetchFlowStepByID",
          {
            flow_ID: docInfo._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const results = response.data.results;
        console.log(results);
        setDocFlowStep(results);

        //setTextFromUser
        const initializedTextFromUser = results[0].add_Text.map((item) => {
          return { ...item, answer: "" };
        });
        setTextFromUser(initializedTextFromUser);
        //setSelectedOtherFile
        const initializedOtherFileFromUser = results[0].add_Other_File.map(
          (item) => {
            return { ...item, file: "" };
          }
        );
        setSelectedOtherFile(initializedOtherFileFromUser);

        // setDataUserSelectApprover
        const initializedDataUserSelectApprover = results.reduce(
          (accumulator, flowStep) => {
            if (flowStep.is_User_Select === "userSelect") {
              accumulator.push({
                step_ID: flowStep.step_ID,
                approver_ID: "",
                role_Approver_ID: flowStep.role_Approver_ID,
              });
            }
            return accumulator;
          },
          []
        );
        setDataUserSelectApprover(initializedDataUserSelectApprover);
      } catch (error) {
        console.log(error);
      }
    }
    fetchInfoDocFlowStep();
  }, []);

  // userInfo
  useEffect(() => {
    async function fetchAllUserInfo() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.get(
          "http://localhost:5000/api/fetchAllUserInfo",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const status = response.data.status;
        const results = response.data.results;
        results?.sort((a, b) => {
          const nameA = a.firstname + a.surname;
          const nameB = b.firstname + b.surname;
          return nameA.localeCompare(nameB);
        });
        if (status === "ok") {
          setAllUserInfo(results);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchAllUserInfo();
  }, []);

  //personInRole
  useEffect(() => {
    async function fetchPersonInRole() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.get(
          "http://localhost:5000/api/fetchAllPersonInRole",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const status = response.data.status;
        const results = response.data.results;

        if (status === "ok") {
          setAllPersonInRole(results);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchPersonInRole();
  }, []);
  return (
    <div className="overlay-send-doc">
      <div className="send-doc">
        <div className="name-doc-flow">
          <IoDocumentTextOutline style={{ fontSize: "20px" }} />{" "}
          <h3>{docInfo.flow_Name}</h3>
        </div>
        <div className="task-name">
          <div className="label">ตั้งชื่อการส่งเอกสารนี้ : </div>
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
          />
        </div>
        {/* send PDF */}
        <div className="send-pdf">
          <div className="label">
            <u>อัฟโหลดเอกสาร(.pdf)</u>
          </div>
          <div className="file-upload-space">
            {previewPDF && (
              <embed
                src={previewPDF}
                type="application/pdf"
                width="141mm"
                height="200mm"
              />
            )}
            {selectedFile && (
              <div>
                {selectedFile.name}
                <IoCloseSharp
                  className="btn-del-file"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewPDF(null);
                  }}
                />
              </div>
            )}
          </div>
          <label
            htmlFor="file-upload-button"
            accept=".pdf"
            className="custom-upload-button"
          >
            <MdUpload /> Upload File
            <input
              type="file"
              id="file-upload-button"
              onChange={handleFileChange}
              style={{ display: "none" }} // ซ่อน input จากการแสดงผล
            />
          </label>
        </div>
        {/* เลือกคนอนุมัติ */}
        <div className="flex-cl ">
          {docFlowStep.map((flowStep, indexFlowStep) => {
            if (flowStep?.is_User_Select === "userSelect") {
              const dataUserApprover = dataUserSelectApprover.find(
                (data) => data.step_ID === flowStep.step_ID
              );
              const filterListApprover = allPersonInRole
                .filter((item) => item.role_ID === flowStep.role_Approver_ID)
                ?.map((item) => item.user_ID);
              // console.log("filter",indexFlowStep,":",filterListApprover)
              return (
                <div key={indexFlowStep} className="flex-cl pd1 bdb1">
                  <div>{flowStep?.topic_Send_To_Approve} :</div>
                  <select
                    className="w300 pd02 mgt05"
                    value={dataUserApprover.approver_ID || ""}
                    onChange={(event) =>
                      handleChangeApprover(dataUserApprover, event)
                    }
                  >
                    <option value={""}>-</option>
                    {allUserInfo.map((approver, indexApprover) => {
                      if (filterListApprover?.includes(approver._id)) {
                        return (
                          <option key={approver._id} value={approver._id}>
                            {approver.firstname + " " + approver.surname}
                          </option>
                        );
                      }
                    })}
                  </select>
                </div>
              );
            }
          })}
        </div>
        {/* เพิ่มข้อมูล */}
        <div
          className={docFlowStep[0]?.add_Text?.length !== 0 ? "add-text" : ""}
        >
          {docFlowStep.length !== 0 && (
            <div>
              {docFlowStep[0].add_Text?.map((item, indexStep) => {
                const correspondingTextFromUser = textFromUser.find(
                  (userItem) => userItem.topic === item.topic
                );
                // console.log(item);
                return (
                  <div key={indexStep} className="box-add-text">
                    <div className="topic">{item.topic} : </div>
                    {item.type_Answer === "Text" && (
                      <input
                        className="input-add-text-user"
                        value={
                          correspondingTextFromUser
                            ? correspondingTextFromUser.answer
                            : ""
                        }
                        onChange={(e) => handleInputChange(e, indexStep)}
                      />
                    )}
                    {item.type_Answer === "Date" && (
                      <DatePicker
                        className="w300 pd02"
                        selected={
                          correspondingTextFromUser
                            ? correspondingTextFromUser.answer
                            : ""
                        }
                        onChange={(date) => handleDateChange(date, indexStep)}
                        dateFormat="dd/MM/yyyy" // กำหนดรูปแบบวันที่ตามที่ต้องการ
                        utcOffset={7}
                      />
                    )}
                    {item.type_Answer === "Date & Time" && (
                      <DatePicker
                        className="w300 pd02"
                        selected={
                          correspondingTextFromUser
                            ? correspondingTextFromUser.answer
                            : ""
                        }
                        onChange={(date) =>
                          handleDateTimeChange(date, indexStep)
                        }
                        showTimeSelect
                        dateFormat="dd/MM/yyyy HH:mm"
                        utcOffset={7}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div
          className={
            docFlowStep[0]?.add_Other_File?.length !== 0 ? "add-other-file" : ""
          }
        >
          {docFlowStep.length !== 0 && (
            <div>
              {docFlowStep[0].add_Other_File?.map((item, indexStep) => {
                const correspondingOtherFileFromUser = selectedOtherFile.find(
                  (userItem) => userItem.topic === item.topic
                );
                console.log(correspondingOtherFileFromUser);

                // console.log(item);
                return (
                  <div key={indexStep} className="box-add-text">
                    <div className="topic">{item.topic}</div>
                    {/* <div className="file-space">{">>"}</div> */}

                    <div style={{ display: "flex" }}>
                      <input
                        type="file"
                        id="other-file-upload-button"
                        onChange={(e) => handleOtherFileChange(e, indexStep)}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="other-file-upload-button"
                        className="custom-other-file-upload-button"
                      >
                        เลือกไฟล์
                      </label>
                      {correspondingOtherFileFromUser.file && (
                        <div className="other-file-box">
                          {correspondingOtherFileFromUser.file.name}
                          <IoCloseSharp
                            className="btn-del-file"
                            onClick={(e) => handlePopFile(e, indexStep)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="user-select-approval"></div>
        <div className="group-btn-doc">
          <button onClick={() => onClose()} className="btn-close">
            ยกเลิก
          </button>
          <button
            onClick={() => handleSendInfoDocument()}
            className="btn-confirm"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverlaySendDoc;
