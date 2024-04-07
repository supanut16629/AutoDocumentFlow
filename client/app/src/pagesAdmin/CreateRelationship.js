import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styleCss/RelationshipStyle.css";
import "../styleCss/MyStyle.css";
import axios from "axios";
import { FaUserGroup } from "react-icons/fa6";

function CreateRelationship() {
  const navigate = useNavigate();

  //input
  const [nameCreateRelationship, setNameCreateRelationship] = useState("");
  const [roleSender, setRoleSender] = useState(null);
  const [roleApproval, setRoleApproval] = useState(null);
  const [isSenderDropdownDisabled, setIsSenderDropdownDisabled] =
    useState(false);
  const [isApprovalDropdownDisabled, setIsApprovalDropdownDisabled] =
    useState(false);

  //selecter
  const [allRole, setAllRole] = useState([]);

  //handle dropdown
  function handleChangeValueSender(event) {
    const selectedRoleId = event.target.value;
    const selectedRole = allRole.find((role) => role._id === selectedRoleId);
    setRoleSender(selectedRole);
    setIsApprovalDropdownDisabled(selectedRoleId);
  }
  function handleChangeValueApproval(event) {
    const selectedRoleId = event.target.value;
    const selectedRole = allRole.find((role) => role._id === selectedRoleId);
    setRoleApproval(selectedRole);
    setIsSenderDropdownDisabled(selectedRoleId);
  }

  //create relationship
  async function createRelationship() {
    if (nameCreateRelationship.trim() === "") {
      return alert("กรุณาใส่ชื่อ");
    }
    if (roleSender === null || roleApproval === null) {
      return alert("กรุณาใส่ข้อมูลให้ครบถ้วน");
    }

    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.post(
        "http://localhost:5000/api/createRelationshipGroup",
        { nameRelationship: nameCreateRelationship, roleSender, roleApproval },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );

      const status = response.data.status;

      //alert เสร็จสิ้น
      //navigate
      if (status === "ok") {
        const id = response.data.result._id;
        const name = response.data.result.relationship_Name;
        alert("สร้าง Relationship สำเร็จ");
        navigate(`/admin/relation/${id}?name=${name}`);
      }
      if (status === "repeat") {
        alert("ชื่อ Relationship ซ้ำกรุณาตั้งชื่อใหม่");
      }
    } catch (error) {
      console.log(error);
    }
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  //ดึงข้อมูล role ทั้งหมด มาใส่ allRole เมื่อรีเรนเดอ
  useEffect(() => {
    async function fetchRole() {
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
        const data = response.data.results;
        // data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
        const compareFunction = (a, b) => {
          if (a.main_Role_ID && !b.main_Role_ID) {
            return 1; // นำ a ไปอยู่หลัง b
          } else if (!a.main_Role_ID && b.main_Role_ID) {
            return -1; // นำ a ไปอยู่หน้า b
          } else {
            // เมื่อทั้ง a และ b มีหรือไม่มี main_Role_ID หรือมีค่าเท่ากัน
            // เรียงตาม role_Name
            return a.role_Name.localeCompare(b.role_Name);
          }
        };

        data.sort(compareFunction);
        if (!isEqual(data, allRole)) {
          setAllRole(data);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    }
    fetchRole();
  }, [allRole]);
  return (
    <div>
      <div className="container-create-rela-window">
        <div className="frame-create">
          <u>
            <h1>สร้าง Relationship ใหม่</h1>
          </u>
          <div className="sub-frame-create">
            <p>ชื่อของ Relationship</p>
            <input
              type="text"
              required={true}
              placeholder="ชื่อของ Relationship ที่ต้องการ"
              value={nameCreateRelationship}
              onChange={(event) =>
                setNameCreateRelationship(event.target.value)
              }
            />
            <p>เลือก Role ของผู้ส่ง </p>
            <div className="select-wrapper">
              <select
                className="select-sender-approver"
                value={roleSender?._id || ""}
                onChange={(event) => handleChangeValueSender(event)}
                style={{ maxHeight: "50px", overflowY: "auto" }}
              >
                <option value={""} disabled>
                  -
                </option>
                {allRole.map((role, roleIndex) => (
                  <option
                    key={roleIndex}
                    value={role._id}
                    disabled={isSenderDropdownDisabled === role._id}
                  >
                    {role.main_Role_ID && <>&nbsp;&nbsp;</>}
                    {role.role_Name}
                  </option>
                ))}
              </select>
            </div>

            <p>เลือก Role ของผู้อนุมัติ</p>
            <div className="select-wrapper">
              <select
                className="select-sender-approver"
                value={roleApproval?._id || ""}
                onChange={(event) => handleChangeValueApproval(event)}
              >
                <option value={""} disabled>
                  -
                </option>
                {allRole.map((role, roleIndex) => (
                  <option
                    key={roleIndex}
                    value={role._id}
                    disabled={isApprovalDropdownDisabled === role._id}
                  >
                    {role.main_Role_ID && <>&nbsp;&nbsp;</>}
                    {role.role_Name}
                  </option>
                ))}
              </select>
            </div>

            <div className="group-btn">
              <button onClick={() => createRelationship()}>+ สร้าง</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateRelationship;
