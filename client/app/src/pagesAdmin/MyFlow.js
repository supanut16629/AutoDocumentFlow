import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styleCss/FlowStyle.css";
import "../styleCss/MyStyle.css";
import axios from "axios";

import { FaRegPlusSquare } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { ImSearch } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";

function MyFlow() {
  const navigate = useNavigate();
  const [allFlow, setAllFlow] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [filterFlow, setFilterFlow] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);

  function handleEditFlow(item) {
    const name = item.flow_Name;
    const id = item._id;
    navigate(`/admin/myFlow/${id}?name=${name}`);
  }

  function handleEnterSearch() {
    setShowDropdown(false);
    setIsSearch(true);
    const filtered = allFlow.filter((item) =>
      item.flow_Name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilterFlow(filtered);
  }

  function handleDeleteSearchTerm() {
    setSearchTerm("");
  }

  function handleResetSearchTerm() {
    setSearchTerm("");
    setShowDropdown(false);
    setIsSearch(false);
  }

  const handleChangeSearchTerm = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

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

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="container-myflow">
        <div className="frame-btn-create-flow">
          <button onClick={() => navigate("/admin/createFlow")}>
            <FaRegPlusSquare />
            <p>Create Flow</p>
          </button>
        </div>
        <div className="frame-all-flow">
          <u>
            <h2>รายการ Flow ทั้งหมด</h2>
          </u>
          <div className="search-bar-menu">
            <div className="search-bar" ref={searchRef}>
              <div className="top">
                <ImSearch
                  title="ค้นหา"
                  className="search"
                  size={18}
                  onClick={() => handleEnterSearch()}
                />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchTerm}
                  onChange={handleChangeSearchTerm}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEnterSearch();
                    }
                  }}
                />
                <RxCross2
                  title="ลบ"
                  className="cross"
                  size={20}
                  onClick={() => handleDeleteSearchTerm()}
                />
                {isSearch && (
                  <GrPowerReset
                    title="รีเซ็ต"
                    className="reset"
                    size={18}
                    onClick={() => handleResetSearchTerm()}
                  />
                )}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  {allFlow
                    .filter((item) =>
                      item.flow_Name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((item, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleEditFlow(item)}
                      >
                        <ImSearch className="icon" />
                        {item.flow_Name}
                      </div>
                    ))}
                  {allFlow.filter((item) =>
                    item.flow_Name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="dropdown-non-item">ไม่มีรายการ</div>
                  )}
                </div>
              )}
            </div>
          </div>
          {isSearch ? (filterFlow.length !== 0 ? (
            <div className="all-menu">
              {filterFlow.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="box-rela-menu"
                    onClick={() => handleEditFlow(item)}
                  >
                    <p>• {item.flow_Name}</p>
                  </div>
                );
              })}
            </div>
          ): <div className="all-menu">ไม่มีรายการflowเอกสารที่ค้นหา</div>) : (
            <div className="all-menu">
              {allFlow.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="box-rela-menu"
                    onClick={() => handleEditFlow(item)}
                  >
                    <p>• {item.flow_Name}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyFlow;
