import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import { ImCross } from "react-icons/im";
import { ImCheckmark } from "react-icons/im";
import { IoIosArrowForward } from "react-icons/io";
import { w3cwebsocket as W3CWebSocket } from "websocket";
function Approval() {
  const navigate = useNavigate();
  const [appTracker, setAppTracker] = useState([]);
  const [docProgress, setDocProgress] = useState([]);
  const [allFlow, setAllFlow] = useState([]);
  const [allUser, setAllUser] = useState([]);

  function handleApprovalDatail(item) {
    const docProgress_ID = item._id;
    navigate(`/main/approval/${docProgress_ID}`);
  }

  async function handleSendApproval(value, updateApproverTracker) {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/approveDocument",
        {
          approval_Status: value,
          updateApproverTracker: updateApproverTracker,
        }
      );
      console.log(
        "status sendApproval :",
        response.data.status,
        response.data.update
      );
    } catch (error) {
      console.log(error);
    }
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  useState(() => {
    async function fetchAppTrackerByApprovalID() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.post(
          "http://localhost:5000/api/fetchAppTrackerByApprovalID",
          {
            approver_ID: userData.data._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        if (response.data.status === "ok") {
          // console.log(response.data.approvalTracker);
          // console.log(response.data.listDocProgressInfo);
          const listDocProgressInfo = response.data.listDocProgressInfo;
          listDocProgressInfo.sort((a, b) => {
            const dateA = new Date(a.dateTime_Create);
            const dateB = new Date(b.dateTime_Create);
            return dateA - dateB;
          });
          // console.log("fetch ApprovalTracker =", response.data.approvalTracker);
          // console.log("fetch DocProgress = ", listDocProgressInfo);
          setAppTracker(response.data.approvalTracker);
          setDocProgress(listDocProgressInfo);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchAppTrackerByApprovalID();
  }, []);
  useEffect(() => {
    async function fetchFlow() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchFlow",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        // console.log(response.data.results);
        const results = response.data.results;

        if (!isEqual(results, allFlow)) {
          // Update state only if the data is different
          setAllFlow(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchFlow();
  }, [allFlow]);

  useEffect(() => {
    async function fetchAllUserInfo() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchAllUserInfo",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        // console.log(response.data.results);
        const results = response.data.results;

        if (!isEqual(results, allUser)) {
          // Update state only if the data is different
          setAllUser(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchAllUserInfo();
  }, [allUser]);

  useEffect(() => {
    const client = new W3CWebSocket("ws://localhost:5000");
    client.onopen = () => {
      console.log("WebSocket Client Connected");
    };

    client.onmessage = (message) => {
      const parsedData = JSON.parse(message.data);
      console.log("ได้รับข้อความว่า :", parsedData);
      const userData = JSON.parse(localStorage.getItem("userData"));
      console.log(parsedData.type);
      const userInfo = userData.data;
      if (
        parsedData.type === "update apptracker" ||
        parsedData.type === "insert apptracker"
      ) {
        if (parsedData.type === "insert apptracker") {
          if (userInfo._id === parsedData.appTracker.approver_ID) {
            // console.log(parsedData.type);
            // console.log(parsedData);
            // console.log("1.2:", parsedData.docProgress._id);
            // console.log("2.1:", parsedData.appTracker._id);
            setDocProgress((prev) => [...prev, parsedData.docProgress]);
            setAppTracker((prev) => [...prev, parsedData.appTracker]);
          }
        } else if (parsedData.type === "update apptracker") {
          // console.log(parsedData.type);
          // console.log(parsedData);
          if (userInfo._id === parsedData.appTracker.approver_ID) {
            setDocProgress((prev) => {
              return prev.map((item) => {
                if (item._id === parsedData.docProgress._id) {
                  return parsedData.docProgress;
                }
                return item;
              });
            });
            setAppTracker((prev) => {
              return prev.map((item) => {
                if (item._id === parsedData.appTracker._id) {
                  return parsedData.appTracker;
                }
                return item;
              });
            });
          }
        }
      } else {
        console.log(parsedData);
      }
    };

    client.onclose = () => {
      console.log("WebSocket Client Disconnected");
      // console.log(docProgress, appTracker);
    };

    return () => {
      client.close();
    };
  }, [docProgress, appTracker]);

  return (
    <div className="container-Home">
      <div className="flex-cl pdr1 pdl1">
        <div className="flex-row ai-c">
          <u>
            <h1>Approval</h1>
          </u>
          <button
            className={"approve-checkmark"}
            onClick={() => navigate("/main/approved")}
          >
            Approved
            <IoIosArrowForward />
          </button>
        </div>
        {/* table */}
        <div className="table">
          <div className="table-column">
            <div>เอกสาร</div>
            <div>ชื่อผู้ส่ง</div>
            <div>เวลาที่ส่ง</div>
            <div className="column-approval">การอนุมัติ</div>
            <div>progress</div>
          </div>

          {docProgress.map((doc, index) => {
            console.log("map docProgress : ", docProgress);
            console.log("map apptracker : ", appTracker);
            const findAppTracker = appTracker.find(
              (item) => item.doc_Progress_ID === doc._id
            );
            if (findAppTracker?.approval_Status === "waiting") {
              const sender = allUser.find((user) => user?._id === doc?.user_ID);
              const dateCreate = new Date(doc?.dateTime_Create);
              const options = {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false, // เพื่อให้ไม่มี AM/PM
                timeZone: "Asia/Bangkok", // เลือกโซนเวลาไทย
              };
              const formattedDate = dateCreate.toLocaleString("th-TH", options);
              // console.log("doc ", index, ":", doc);
              return (
                <div key={index} className="table-row" onClick={()=>handleApprovalDatail(doc)}>
                  <div>
                    {/* {doc?.sending_Doc_Name} */}

                    {
                      allFlow.find((flow) => flow._id === doc.flow_ID)
                        ?.flow_Name
                    }
                  </div>
                  <div>{sender?.firstname + " " + sender?.surname}</div>
                  <div>{formattedDate}</div>
                  <div>
                    <button
                      className="approve-checkmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendApproval("success", findAppTracker);
                      }}
                    >
                      <ImCheckmark />
                      อนุมัติ
                    </button>{" "}
                    <button
                      className="approve-cross"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendApproval("fail", findAppTracker);
                      }}
                    >
                      <ImCross />
                      ไม่อนุมัติ
                    </button>
                  </div>
                  <div className="steps-container">
                    {[...Array(doc.total_State).keys()].map((step) => {
                      return (
                        <div key={step} className="flex-row ai-c">
                          <div
                            title={`${
                              step === doc.current_State
                                ? doc.doc_Status === "fail"
                                  ? "ไม่อนุมัติ"
                                  : doc.doc_Status === "success"
                                  ? "สำเร็จ"
                                  : "รอการอนุมัติ"
                                : step < doc.current_State
                                ? "สำเร็จ"
                                : ""
                            }`}
                            className={`step ${
                              step === doc.current_State
                                ? doc.doc_Status === "fail"
                                  ? "failed-step"
                                  : doc.doc_Status === "success"
                                  ? "completed-step"
                                  : "current-step"
                                : step < doc.current_State
                                ? "completed-step"
                                : ""
                            }`}
                          ></div>
                          {step !== doc.total_State - 1 && (
                            <div className="line-step"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}

          {docProgress.length === 0 && (
            <div className="table-none-row">
              <u>ไม่มีรายการ</u>
            </div>
          )}
          {/* {docProgress.length > 0 && (
            <div className="test-box table-none-row ">
              <u>
                มีรายการ ความยาว{docProgress.length}{" "}
                {docProgress[docProgress.length]?.sending_Doc_Name}
              </u>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

export default Approval;

// const updatedNewAppTracker = appTracker.map((item) => {
//   if (item?._id === updatedAppTracker?._id) {
//     return updatedAppTracker;
//   }
//   return item;
// });
// const updatedProgress = docProgress.map((progress) => {
//   // ถ้า _id ของ progress ตรงกับ _id ของ updatedDocProgress
//   if (progress?._id === updatedDocProgress?._id) {
//     // ให้ใช้ updatedDocProgress ในการอัพเดท progress
//     return updatedDocProgress;
//   }
//   // ถ้า _id ไม่ตรงกันให้คงอยู่เหมือนเดิม
//   return progress;
// });
