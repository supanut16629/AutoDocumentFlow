import React, { useState, useEffect } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import axios from "axios";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import { useNavigate } from "react-router-dom";
function History() {
  const navigate = useNavigate()
  const [docProgress, setDocProgress] = useState([]);
  const [allFlow, setAllFlow] = useState([]);

  function handleProgressDatail(docProgress) {
    const docProgress_ID = docProgress._id;
    navigate(`/main/progress/${docProgress_ID}`);
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  //fetchDocumentProgress
  useEffect(() => {
    async function fetchDocumentProgress() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.post(
          "http://localhost:5000/api/fetchDocumentProgressByUserID",
          {
            user_ID: userData.data._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const status = response.data.status;
        const newDocProgress = response.data.docProgress;
        if (status === "ok") {
          newDocProgress.sort((a, b) => {
            const dateA = new Date(a.dateTime_Create);
            const dateB = new Date(b.dateTime_Create);
            return dateA - dateB;
          });
          console.log(newDocProgress);
          setDocProgress(newDocProgress);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchDocumentProgress();
  }, []);

  //fetchFlow
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

  //realtime update
  useEffect(() => {
    const client = new W3CWebSocket("ws://localhost:5000");
    client.onopen = () => {
      console.log('WebSocket Client Connected');
    };

    client.onmessage = (message) => {
      console.log("Received message from server:", message.data);
      const userData = JSON.parse(localStorage.getItem("userData"));
      const userInfo = userData.data;
      const parsedData = JSON.parse(message.data);
      const updatedDocProgress = parsedData.docProgress;
      console.log("type :",parsedData.type);
      console.log("msg Doc :",updatedDocProgress);
      if(parsedData.type === "update apptracker"){
        if(userInfo._id === parsedData.docProgress.user_ID){
          setDocProgress((prev) => {
            return prev.map((item) => {
              if (item._id === parsedData.docProgress._id) {
                return parsedData.docProgress;
              }
              return item;
            });
          });
        }
      }
    };

    client.onclose = () => {
      console.log("WebSocket Client Disconnected");
    };

    return () => {
      client.close();
    };
  }, [docProgress]);
  return (
    <div className="container-Home">
      <div className="flex-cl pdr1 pdl1">
        <u>
          <h1>History</h1>
        </u>
        {/* table */}
        <div className="table">
          <div className="table-column">
            <div>ชื่อการส่งเอกสาร</div>
            <div>ประเภทเอกสาร</div>
            <div>เวลาที่ส่ง</div>
            <div>เวลาที่อัปเดต</div>
            <div>สถานะProgress</div>
          </div>
          {docProgress.map((doc, index) => {
            const dateLastTime = new Date(doc.lastTime_Edit);
            const dateCreate = new Date(doc.dateTime_Create);
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

            const formattedDate = dateLastTime.toLocaleString("th-TH", options);
            const formattedDateCreate = dateCreate.toLocaleString(
              "th-TH",
              options
            );
            if (doc.doc_Status !== "waiting") {
              return (
                <div key={index} className="table-row" onClick={() =>handleProgressDatail(doc)}>
                  <div>{doc.sending_Doc_Name}</div>
                  <div>
                    {
                      allFlow.find((flow) => flow._id === doc.flow_ID)
                        ?.flow_Name
                    }
                  </div>
                  <div>{formattedDateCreate}</div>
                  <div>{formattedDate}</div>
                  <div className="steps-container">
                    {[...Array(doc.total_State).keys()].map((step) => {
                      console.log(
                        "step (",
                        step,
                        ") , doc.current_State (",
                        doc.current_State,
                        ")  doc_Status:",
                        doc.doc_Status
                      );
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
            <div className="table-none-row"><u>ไม่มีรายการ</u></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
