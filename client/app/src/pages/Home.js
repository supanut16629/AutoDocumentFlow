import React, { useEffect, useCallback, useState, useRef } from "react";
import "../styleCss/MainStyle.css";
import "../styleCss/MyStyle.css";
import axios from "axios";

import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa"; //ดาวเต็ม
import OverlaySendDoc from "../components/OverlaySendDoc";
function Home() {
  const [docFlow, setDocFlow] = useState([]);
  const [favDocFlow, setFavDocFlow] = useState([]);
  const [selectDocTosend, setSelectDocTosend] = useState(null);

  function handleSendDocFlow(doc) {
    setSelectDocTosend(doc);
  }

  function handleOnCloseOverlay() {
    setSelectDocTosend(null);
  }
  async function handleSelectedFavDocFlow(doc, selectType) {
    console.log("ติดตามเอกสาร", selectType, doc);
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (selectType === "add") {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/insertFavDocFlow",
          {
            user_ID: userData.data._id,
            doc_ID: doc._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        console.log(response.data.newResults);
        const newResults = response.data.newResults;
        setFavDocFlow(newResults);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/delFavDocFlow",
          {
            user_ID: userData.data._id,
            doc_ID: doc._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const newResults = response.data.newResults;
        setFavDocFlow(newResults);
      } catch (error) {
        console.log(error);
      }
    }
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  useEffect(() => {
    async function fetchDocFlowByUserID() {
      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const response = await axios.post(
          "http://localhost:5000/api/fetchDocFlowByUserID",
          {
            user_id: userData.data._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const results = response.data.results;
        results?.sort((a, b) => {
          const nameA = a.flow_Name;
          const nameB = b.flow_Name;
          return nameA.localeCompare(nameB);
        });
        if (!isEqual(results, docFlow)) {
          // Update state only if the data is different
          setDocFlow(results);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchDocFlowByUserID();
  }, [docFlow]);

  useEffect(() => {
    async function fetchFavDocFlowByUserID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const response = await axios.post(
        "http://localhost:5000/api/fetchFavDocFlowByIDUser",
        {
          user_id: userData.data._id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      const results = response.data.results;
      results?.sort((a, b) => {
        const nameA = a.flow_Name;
        const nameB = b.flow_Name;
        return nameA.localeCompare(nameB);
      });
      setFavDocFlow(results);
    }
    fetchFavDocFlowByUserID();
  }, []);
  return (
    <div>
      <div className="container-Home">
        <div className="container-doc-flow-1">
          <u>
            <h1>Flow เอกสาร</h1>
          </u>
          <div className="frame-all-render-flow">
            {docFlow.slice(0, 10).map((doc, index) => {
              return (
                <div
                  key={index}
                  className="box-doc-flow"
                  onClick={() => handleSendDocFlow(doc)}
                >
                  <div className="label">{doc.flow_Name}</div>
                  <div className="btn-fav-star">
                    {favDocFlow.some((favDoc) => favDoc._id === doc._id) ? (
                      <FaStar
                        title="ติดตามแล้ว"
                        className="star"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectedFavDocFlow(doc, "cancel");
                        }}
                      />
                    ) : (
                      <FaRegStar
                        title="กดติดตาม"
                        className="star-empty"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectedFavDocFlow(doc, "add");
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {docFlow.length === 0 && (
              <div className="table-none-row"><u>ไม่มีรายการเอกสารที่คุณสามารถใช้งานได้</u></div>
            )}
          </div>
        </div>
        <div className="container-fav-doc-flow-2">
          <u>
            <h1>Flow เอกสารที่ชื่นชอบ</h1>
          </u>
          <div className="frame-all-render-flow">
            {favDocFlow.map((doc, index) => {
              return (
                <div
                  key={index}
                  className="box-doc-flow"
                  onClick={() => handleSendDocFlow(doc)}
                >
                  <div className="label">{doc.flow_Name}</div>
                  <div className="btn-fav-star">
                    {favDocFlow.some((favDoc) => favDoc._id === doc._id) ? (
                      <FaStar
                        title="ติดตามแล้ว"
                        className="star"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectedFavDocFlow(doc, "cancel");
                        }}
                      />
                    ) : (
                      <FaRegStar
                        title="กดติดตาม"
                        className="star-empty"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectedFavDocFlow(doc, "add");
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {favDocFlow.length === 0 && (
              <div className="table-none-row"><u>ไม่มีรายการเอกสารที่คุณติดตาม</u></div>
            )}
          </div>
        </div>
        {selectDocTosend !== null && (
          <OverlaySendDoc
            docInfo={selectDocTosend}
            onClose={handleOnCloseOverlay}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
