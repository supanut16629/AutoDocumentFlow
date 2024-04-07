import React, { useEffect, useState } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import { IoIosArrowBack } from "react-icons/io";
const Approved = () => {
  const navigate = useNavigate();
  const [appTracker, setAppTracker] = useState([]);
  const [track, setTrack] = useState([]);
  const [docProgress, setDocProgress] = useState([]);
  const [allFlow, setAllFlow] = useState([]);
  const [allUser, setAllUser] = useState([]);

  function handleApprovalDatail(item) {
    const docProgress_ID = item._id;
    navigate(`/main/approval/${docProgress_ID}`);
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  //fetch AppTracker By ApprovalID
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
          setAppTracker(response.data.approvalTracker);
          setDocProgress(listDocProgressInfo);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchAppTrackerByApprovalID();
  }, []);

  useState(() => {
    async function fetchTrack() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.get(
          "http://localhost:5000/api/fetchTrack",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        if (response.data.status === "ok") {
          setTrack(response.data.results);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchTrack();
  }, []);

  //fetch flow
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

        console.log(response.data.results);
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

  //fetch user
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

        console.log(response.data.results);
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
      if (parsedData.type === "update apptracker") {
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
          setTrack((prev) => {
            return prev.map((item) => {
              if(item._id === parsedData.track._id){
                return parsedData.track;
              }
              return item;
            })
          })
        }
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
            <h1>Approved</h1>
          </u>
          <button
            className={"approve-checkmark"}
            onClick={() => navigate("/main/approval")}
          >
            <IoIosArrowBack />
            Approval
          </button>
        </div>
        <div className="table">
          <div className="table-column">
            <div>เอกสาร</div>
            <div>ชื่อผู้ส่ง</div>
            <div>เวลาที่อนุมัติ</div>
            <div>ผลการอนุมัติ</div>
            <div>Progress</div>
          </div>
          {docProgress.map((doc, index) => {
            const findAppTracker = appTracker.find(
              (item) => item.doc_Progress_ID === doc._id
            );

            if (findAppTracker.approval_Status !== "waiting") {
              const findTrack = track.find(
                (item) =>
                  item.doc_Progress_ID === findAppTracker.doc_Progress_ID &&
                  item.step_ID === findAppTracker.step_ID
              );
              const dateCreate = new Date(findTrack?.date_Completed);
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
              const sender = allUser.find((user) => user._id === doc.user_ID);

              return (
                <div key={index} className="table-row" onClick={()=>handleApprovalDatail(doc)}>
                  <div>
                    {
                      allFlow.find((flow) => flow._id === doc.flow_ID)
                        ?.flow_Name
                    }
                  </div>
                  <div>{sender?.firstname + " " + sender?.surname}</div>
                  <div>{formattedDate}</div>
                  <div>
                    {findAppTracker.approval_Status === "success"
                      ? "อนุมัติ"
                      : "ไม่อนุมัติ"}
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
        </div>
      </div>
    </div>
  );
};

export default Approved;
