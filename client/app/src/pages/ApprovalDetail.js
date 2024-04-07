import React, { useState, useEffect } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import axios from "axios";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import { useNavigate, useParams } from "react-router-dom";
import { TbListDetails } from "react-icons/tb";
const ApprovalDetail = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [docProgressInfo, setDocProgressInfo] = useState();
  const [allFlow, setAllFlow] = useState([]);
  const [userInfo, setUserInfo] = useState([]);

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  //fetch DocProgress Selected
  useEffect(() => {
    async function fetchDocProgressByID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchDocProgressByID",
          {
            docProgress_ID: params.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        if (response.data.status === "ok") {
          console.log(response.data.result);
          setDocProgressInfo(response.data.result);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchDocProgressByID();
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

  //fetch user info
  useEffect(() => {
    // fetchAllUserInfo
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

        const results = response.data.results;

        if (!isEqual(results, allFlow)) {
          // Update state only if the data is different
          setUserInfo(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchAllUserInfo();
  }, [userInfo]);

  //realtime update
  useEffect(() => {
    const client = new W3CWebSocket("ws://localhost:5000");
    client.onopen = () => {
      console.log('WebSocket Client Connected');
    };

    client.onmessage = (message) => {
      console.log("Received message from server:", message.data);
      const userData = JSON.parse(localStorage.getItem("userData"));
      const userInfoData = userData.data;
      const parsedData = JSON.parse(message.data);
      const updatedDocProgress = parsedData.docProgress;
      console.log("type :",parsedData.type);
      console.log("msg Doc :",updatedDocProgress);
      if(parsedData.type === "update apptracker"){
        if(userInfoData._id === parsedData.docProgress.user_ID){
          if(docProgressInfo._id === parsedData.docProgress._id){
            setDocProgressInfo(parsedData.docProgress)
          }
        }
      }
    };

    client.onclose = () => {
      console.log("WebSocket Client Disconnected");
    };

    return () => {
      client.close();
    };
  }, [docProgressInfo]);
  return (
    <div className="container-Home">
      <div className="flex-cl pdr1 pdl1">
        <div className="over-y-auto max-h590">
          <h2>
            {
              allFlow.find((flow) => flow._id === docProgressInfo?.flow_ID)
                ?.flow_Name
            }
          </h2>
          <div className="pdf-perview">
            {docProgressInfo?.name_Document_File && (
              <embed
                src={require(`../../../../server/fileDocument/${docProgressInfo?.name_Document_File}`)}
                type="application/pdf"
                width="375mm"
                height="500mm"
              />
            )}
          </div>
          <div className="flex-cl ai-c">
            <div className="flex-row w400 ai-c font-detail">
              <TbListDetails />
              <u>รายละเอียด</u>
            </div>
          </div>

          <div className="flex-cl ai-c">
            <div className="flex-row w400">
              ผู้ส่งเอกสาร :{" "}
              {
                userInfo.find((user) => user._id === docProgressInfo?.user_ID)
                  ?.firstname
              }{" "}
              {
                userInfo.find((user) => user._id === docProgressInfo?.user_ID)
                  ?.surname
              }
            </div>
            <div className="flex-row w400">
              สถานะเอกสาร :{" "}
              {docProgressInfo?.doc_Status === "waiting"
                ? "กำลังดำเนินการ"
                : docProgressInfo?.doc_Status === "success"
                ? "อนุมัติสำเร็จ"
                : "ไม่อนุมัติ"}
            </div>
            <div className="flex-row w400 ai-c font-detail">
              <TbListDetails />
              <u>รายละเอียดเพิ่มเติม</u>
            </div>
            {docProgressInfo?.data_Add_Text?.map((item, index) => {
              let formattedDate;
              if (
                item.type_Answer === "Date & Time" ||
                item.type_Answer === "Date"
              ) {
                const dateAnswer = new Date(item.answer);
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

                formattedDate = dateAnswer.toLocaleString("th-TH", options);
              }
              return (
                <div key={index}>
                  <div className="flex-row w400">
                    {item.topic} :{" "}
                    {item.type_Answer === "Date & Time" ||
                    item.type_Answer === "Date"
                      ? formattedDate
                      : item.answer}
                  </div>
                </div>
              );
            })}
            <div className="flex-cl ai-c">
              {docProgressInfo?.data_Add_Other_File?.map((item, index) => {
                return (
                  <div key={index} className="flex-row w400 ">
                    {item.file.endsWith(".png") ||
                    item.file.endsWith(".jpeg") ||
                    item.file.endsWith(".jpg") ? (
                      // ถ้าเป็นไฟล์รูปภาพ
                      <div>
                        <p>{item.topic}</p>
                        <img
                          src={require(`../../../../server/otherFile/${item.file}`)}
                          alt={item.topic}
                          className="image-container b-shadow-02"
                        />
                      </div>
                    ) : (
                      // ถ้าไม่เป็นไฟล์รูปภาพ
                      <div>
                        <p>{item.topic}</p>
                        <div className="filename-container">{item.file}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "1rem", width: "100%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetail;
