import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styleCss/RelationshipStyle.css";
import "../styleCss/MyStyle.css";

import { FaRegPlusSquare } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { ImSearch } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";

function Relationship() {
  const navigate = useNavigate();
  const [allRelationship, setAllRelationship] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [filterRelationship, setFilterRelationship] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef(null);

  function handleEditRelationship(item) {
    const name = item.relationship_Name;
    const id = item._id;
    navigate(`/admin/relation/${id}?name=${name}`);
  }

  function handleEnterSearch() {
    setShowDropdown(false);
    setIsSearch(true);
    const filtered = allRelationship.filter((item) =>
      item.relationship_Name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilterRelationship(filtered);
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

        if (!isEqual(results, allRelationship)) {
          // Update state only if the data is different
          setAllRelationship(results);
        }
      } catch (error) {
        console.error("Error fetching relationship:", error);
      }
    }
    fetchRelationship();
  }, [allRelationship]);

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
      <div className="container-rela-window">
        <div className="frame-btn-create-rela">
          <button onClick={() => navigate("/admin/createRelation")}>
            <FaRegPlusSquare />
            <p>Create Relationship</p>
          </button>
        </div>
        <div className="frame-all-rela">
          <u>
            <h2>รายการ Relationship ทั้งหมด</h2>
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
                  {allRelationship
                    .filter((item) =>
                      item.relationship_Name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((item, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleEditRelationship(item)}
                      >
                        <ImSearch className="icon"/>
                        {item.relationship_Name}
                      </div>
                    ))}
                  {allRelationship.filter((item) =>
                    item.relationship_Name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="dropdown-non-item">ไม่มีรายการ</div>
                  )}
                </div>
              )}
            </div>
          </div>
          {isSearch ? (filterRelationship.length !== 0 ? (
            <div className="all-menu">
              {filterRelationship.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="box-rela-menu"
                    onClick={() => handleEditRelationship(item)}
                  >
                    <p>• {item.relationship_Name}</p>
                  </div>
                );
              })}
            </div>
          ): <div className="all-menu">ไม่มีรายการความสัมพันธ์ที่ค้นหา</div>) : (
            <div className="all-menu">
              {allRelationship.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="box-rela-menu"
                    onClick={() => handleEditRelationship(item)}
                  >
                    <p>• {item.relationship_Name}</p>
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

export default Relationship;
