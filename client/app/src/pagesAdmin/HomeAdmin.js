import React, { useEffect, useState } from "react";
import "../styleCss/HomeAdminStyle.css";
import "../styleCss/MyStyle.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function HomeAdmin() {
  const navigate = useNavigate();
  const [flowRecommend, setFlowRecommend] = useState([]);
  const [relationshipRecommend, setRelationshipRecommend] = useState([]);

  function handleEditFlow(flow) {
    const name = flow.flow_Name;
    const id = flow._id;
    navigate(`/admin/myFlow/${id}?name=${name}`);
  }

  function handleEditRelationship(rel) {
    const name = rel.relationship_Name;
    const id = rel._id;
    navigate(`/admin/relation/${id}?name=${name}`);
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

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

        if (!isEqual(results, flowRecommend)) {
          // Update state only if the data is different
          setFlowRecommend(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchFlow();
  }, [flowRecommend]);

  useEffect(() => {
    async function fetchRelationship() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchRelationship",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        console.log(response.data.results);
        const results = response.data.results;

        if (!isEqual(results, relationshipRecommend)) {
          // Update state only if the data is different
          setRelationshipRecommend(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchRelationship();
  }, [relationshipRecommend]);

  return (
    <div className="container-home-admin">
      <div className="sub-container-flow">
        <u>
          <h1>รายการ Flow</h1>
        </u>
        <div className="frame-all-rela">
          <div className="all-menu">
            {flowRecommend.map((flow, index) => {
              return (
                <div
                  key={index}
                  className="box-rela-menu"
                  onClick={() => handleEditFlow(flow)}
                >
                  <p>• {flow.flow_Name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="sub-container-relationship">
        <u>
          <h1>รายการ Relationship</h1>
        </u>
        <div className="frame-all-rela">
          <div className="all-menu">
            {relationshipRecommend.map((rel, index) => {
              return (
                <div
                  key={index}
                  className="box-rela-menu"
                  onClick={() => handleEditRelationship(rel)}
                >
                  <p>• {rel.relationship_Name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeAdmin;
