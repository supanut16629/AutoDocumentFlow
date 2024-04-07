import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

import { RiArrowGoBackFill } from "react-icons/ri";
import { ImCross } from "react-icons/im";
import { MdAdd } from "react-icons/md";
import { MdOutlineSaveAlt } from "react-icons/md";
import { MdOutlineEdit } from "react-icons/md";
import { RiArrowRightSFill } from "react-icons/ri";
import "../styleCss/RelationshipStyle.css";
import "../styleCss/MyStyle.css";
import { FaUserGroup } from "react-icons/fa6";


const EditRelationship = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [relationshipInfo, setRelationshipInfo] = useState([]);
  const [editedRelationshipName, setEditedRelationshipName] = useState("");
  const [editSenderID, setEditSenderID] = useState("");
  const [editApprovalID, setEditApprovalID] = useState("");
  //ต้องเพิ่มให้แก้ไข role ผู้ส่ง กับ ผู้อนุมัติได้ แต่จะต้องเริ่ม edit ใหม่หมด
  
  const [isEditInfo, setIsEditInfo] = useState(false); //ไว้เช็ค ว่ามีกดการเปลี่ยนชื่อไหม
  const [allRole, setAllRole] = useState([]); //ลิสในการทำ dropdown selecter **อาจจะต้องเปลี่ยนเป็น sub_role ของ main_role
  const [relationshipStep, setRelationshipStep] = useState([]); //ข้อมูลที่จะสร้างใหม่
  const [isEditing, setIsEditing] = useState(false); // Track editing state

  const [listApproverInfo, setListApproverInfo] = useState([]); //น่าจะเอาไว้เลือกคนที่จะอนุมัติได้

  function checkDataChange() {
    if (
      editSenderID !== relationshipInfo.role_Sender_ID ||
      editApprovalID !== relationshipInfo.role_Approval_ID
    ) {
      // alert ว่า ต้องการเปลี่ยนข้อมูลใช่มั้ย ถ้ากดใช้ ให้ไปเรียก handleChangeRelationshipInfo() ถ้าไม่ ให้ return
      const confirmChange = window.confirm(
        "ข้อมูลRole มีการเปลี่ยนแปลงจะทำให้ความสัมพันธ์ทุกขั้นตอนหายหมด \nคุณต้องการเปลี่ยนแปลงข้อมูลใช่หรือไม่?"
      );
      if (confirmChange) {
        handleChangeRelationshipInfo("RoleChange");
        return;
      } else {
        setEditSenderID(relationshipInfo.role_Sender_ID);
        setEditApprovalID(relationshipInfo.role_Approval_ID);
        setEditedRelationshipName(relationshipInfo.relationship_Name);
        setIsEditInfo(false);
        return;
      }
    }
    handleChangeRelationshipInfo("RoleNotChange");
  }

  //function ในการเปลี่ยนชื่อความสัมพันธ์ จะเอาไว้บันทึก Roleส่ง Roleอนุมัติ ด้วย
  async function handleChangeRelationshipInfo(statusRoleChange) {
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      if (statusRoleChange === "RoleNotChange") {
        const response = await axios.post(
          "http://localhost:5000/api/changeRelationshipName",
          {
            id: params.id,
            newName: editedRelationshipName,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const status = response.data.status;
        const updateRelationship = response.data.updateRelationship;
        const newRelaltionShipName = updateRelationship.relationship_Name;
        if (status === "ok") {
          // setRelationshipName(editedRelationshipName);
          setRelationshipInfo(updateRelationship);
          navigate(`/admin/relation/${params.id}?name=${newRelaltionShipName}`);
        }
      } else if (statusRoleChange === "RoleChange") {
        const response = await axios.post(
          "http://localhost:5000/api/changeRelationshipInfo",
          {
            id: params.id,
            newName: editedRelationshipName,
            newRoleSenderID: editSenderID,
            newRoleApprovalID: editApprovalID,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const status = response.data.status;
        const updateRelationshipInfo = response.data.updateRelationshipInfo;
        // console.log("status:", status, "  update:", updateRelationshipInfo);
        if (status === "ok") {
          setRelationshipInfo(updateRelationshipInfo);
          setEditSenderID(updateRelationshipInfo.role_Sender_ID);
          setEditApprovalID(updateRelationshipInfo.role_Approval_ID);
          await axios
            .post(
              "http://localhost:5000/api/findUserByRoleID",
              {
                role_Approval_ID: updateRelationshipInfo.role_Approval_ID,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + userData.token,
                },
              }
            )
            .then((res) => res.data)
            .then((data) => {
              setListApproverInfo(data.results);
            });

          setRelationshipStep([]);
          setIsEditing(false);
          navigate(
            `/admin/relation/${params.id}?name=${updateRelationshipInfo.relationship_Name}`
          );
        }
      }
      setIsEditInfo(false);
      console.log("finish");
    } catch (error) {
      console.log("catch error :", error);
    }
  }

  //สร้าง ความสัมพันธ์ใหม่
  const handleNewRelationship = () => {
    const newIndex = relationshipStep.length;
    const newRelationshipObject = {
      step_ID: newIndex,
      relationship_ID: params.id,
      sub_Role_Sender_ID: "",
      Approver_ID: "",
    };

    setRelationshipStep((prevRelationships) => [
      ...prevRelationships,
      newRelationshipObject,
    ]);
    setIsEditing(true);
  };

  //function ในการลบ
  const handleDeleteRelationship = (indexToDelete) => {
    const confirmDelete = window.confirm("คุณต้องการลบความสัมพันธ์นี้หรือไม่?");
    if (confirmDelete) {
      const relationshipsToDelete = relationshipStep.filter(
        (rel) => rel.step_ID === indexToDelete
      );
      console.log("Relationships to delete:", relationshipsToDelete);

      // Update relationships after deletion
      const updatedRelationships = relationshipStep
        .filter((relationship) => relationship.step_ID !== indexToDelete)
        .map((rel, index) => ({
          ...rel,
          step_ID: index,
        }));

      // Set relationships with the updated values
      setRelationshipStep(updatedRelationships);

      setIsEditing(true); // Set editing to true after deletion
      console.log("หลังจากลบ =", relationshipStep);
    }
  };

  //เปลี่ยนข้อมูล select ตรง header
  const handleChangeRoleSender = (event) => {
    const value = event.target.value;
    setEditSenderID(value);
  };
  const handleChangeRoleApproval = (event) => {
    const value = event.target.value;
    setEditApprovalID(value);
  };

  //เปลี่ยนข้อมูล select ตรงbody
  const handleChangeSubRoleSender = (itemIndex, selectedValue) => {
    setRelationshipStep((prevRelationships) => {
      const updatedRelationships = prevRelationships.map((relationshipStep) =>
        relationshipStep.step_ID === itemIndex
          ? { ...relationshipStep, sub_Role_Sender_ID: selectedValue }
          : relationshipStep
      );
      return updatedRelationships;
    });
    setIsEditing(true);
  };
  const handleChangeApprover = (itemIndex, selectedValue) => {
    setRelationshipStep((prevRelationships) => {
      const updatedRelationships = prevRelationships.map((relationshipStep) =>
        relationshipStep.step_ID === itemIndex
          ? { ...relationshipStep, Approver_ID: selectedValue }
          : relationshipStep
      );
      return updatedRelationships;
    });
    setIsEditing(true);
  };

  //ต้องเปลี่ยน การบันทึก
  const handleSaveRelationship = async () => {
    //
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      console.log("ข้อมูลที่จะส่งไปsave", relationshipStep);
      const response = await axios.post(
        "http://localhost:5000/api/saveRelationshipStep",
        {
          listData: relationshipStep,
          relationship_ID: params.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      const statusSave = response.data.status;

      if (statusSave === "save") {
        alert("บันทึกสำเร็จ");
        setIsEditing(false);
      } else if (statusSave === "can't save") {
        alert("กรุณากรอกข้อมูลให้ถูกต้อง");
        setIsEditing(true);
      }
    } catch (error) {
      console.log("Error :", error);
    }
  };

  const handleNavigate = () => {
    if (isEditing) {
      const confirmLeave = window.confirm(
        "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออก?"
      );

      if (confirmLeave) {
        // User confirmed leaving, navigate away
        navigate("/admin/relation");
      }
      // If the user cancels, do nothing
    } else {
      // No unsaved changes, navigate away
      navigate("/admin/relation");
    }
  };

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  //ต้องเปลี่ยน allRole
  useEffect(() => {
    async function fetchAllRole() {
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
        // console.log(response.data.results);
        const results = response.data.results;
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

        results.sort(compareFunction);

        if (!isEqual(results, allRole)) {
          setAllRole(results);
        }
      } catch (error) {
        console.log("Fetch role Error :", error);
      }
    }
    fetchAllRole();
  }, [allRole]);

  //ดึง relationship idมา
  useEffect(() => {
    async function fetchRelationshipInfoByID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchRelationshipInfoByID",
          {
            relationship_ID: params.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        const result = response.data.result;
        setRelationshipInfo(result);
        setEditedRelationshipName(result.relationship_Name);
        setEditSenderID(result.role_Sender_ID);
        setEditApprovalID(result.role_Approval_ID);

        const responseApprover = await axios.post(
          "http://localhost:5000/api/findUserByRoleID",
          {
            role_Approval_ID: result.role_Approval_ID,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const listApprover = responseApprover.data.results;
        setListApproverInfo(listApprover);
      } catch (error) {
        console.log(error);
      }
    }
    fetchRelationshipInfoByID();
  }, []);
  //ดึง relationshp ทุก step มา
  useEffect(() => {
    async function fetchRelationshipStepByID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchRelationshipByID",
          {
            relationship_ID: params.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        const results = response.data.results;
        console.log("fetch all step relationship", results);
        setRelationshipStep(results);
      } catch (error) {
        console.log("catch error", error);
      }
    }
    fetchRelationshipStepByID();
  }, []);

  return (
    <div className="container-edit-rela">
      {/* header */}
      <div className="header-edit-rela">
        <div className="box-btn-edit-name-rela">
          {!isEditInfo ? (
            <button
              className="icon-edit-name-rela"
              title="แก้ไขความสัมพันธ์"
              onClick={() => setIsEditInfo(true)}
            >
              <MdOutlineEdit />
              <u>แก้ไข</u>
            </button>
          ) : (
            <button
              className="icon-edit-name-rela"
              title="บันทึกความสัมพันธ์"
              onClick={() => checkDataChange()}
            >
              <MdOutlineSaveAlt />
              <u>บันทึก</u>
            </button>
          )}
        </div>

        <div className="edit-rela-header">
          <div className="rela-name-edit">
            <p style={{ margin: "0" }}>ชื่อความสัมพันธ์ : </p>
            {isEditInfo ? (
              <div className="edit-name-frame">
                <input
                  className="input-rela"
                  type="text"
                  value={editedRelationshipName}
                  onChange={(e) => setEditedRelationshipName(e.target.value)}
                ></input>{" "}
              </div>
            ) : (
              <p>{relationshipInfo.relationship_Name}</p>
            )}
            <RiArrowGoBackFill
              title="ย้อนกลับ"
              className="icon-go-back"
              onClick={() => handleNavigate()}
            />
          </div>
          <div className="edit-info-frame">
            <div>
              <p>Roleผู้ส่ง :</p>
              {isEditInfo ? (
                <div className="select-wrapper">
                  <select
                    className="select-sender-approver"
                    value={editSenderID}
                    onChange={(event) => handleChangeRoleSender(event)}
                    style={{ maxHeight: "50px", overflowY: "auto" }}
                  >
                    {allRole.map((role, roleIndex) => (
                      <option
                        key={roleIndex}
                        value={role._id}
                        disabled={
                          relationshipInfo.role_Approval_ID === role._id
                        }
                      >
                        {role.main_Role_ID && <>&nbsp;&nbsp;</>}
                        {role.role_Name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <FaUserGroup />
                  {
                    allRole.find(
                      (role) => role._id === relationshipInfo.role_Sender_ID
                    )?.role_Name
                  }
                </div>
              )}
            </div>
            <div className="all-arrow-right">
              <div className="arrow-ver-line"></div>
              <div className="arrow-right-head"></div>
            </div>
            <div>
              <p>Roleผู้อนุมัติ : </p>
              {isEditInfo ? (
                <div className="select-wrapper">
                  <select
                    className="select-sender-approver"
                    value={editApprovalID}
                    onChange={(event) => handleChangeRoleApproval(event)}
                    style={{ maxHeight: "50px", overflowY: "auto" }}
                  >
                    {allRole.map((role, roleIndex) => (
                      <option
                        key={roleIndex}
                        value={role._id}
                        disabled={relationshipInfo.role_Sender_ID === role._id}
                      >
                        {role.main_Role_ID && <>&nbsp;&nbsp;</>}
                        {role.role_Name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <FaUserGroup />
                  {
                    allRole.find(
                      (role) => role._id === relationshipInfo.role_Approval_ID
                    )?.role_Name
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="body-edit-rela">
        {isEditInfo && <div className="overlay-body-edit-rela" />}
        <div className="edit-rela-body">
          {/* ปุ่มบันทึก เพิ่มความสัมพันธ์ */}
          <div className="btn-add-step-n-save">
            <button
              onClick={() => handleNewRelationship()}
              className={
                isEditInfo ? "save-non-active" : "add-step-relationship"
              }
              disabled={isEditInfo}
            >
              <MdAdd/>
              เพิ่มความสัมพันธ์
            </button>
            <button
              onClick={() => handleSaveRelationship()}
              className={
                isEditInfo
                  ? "save-non-active"
                  : isEditing
                  ? "save-active"
                  : "save-non-active"
              }
              disabled={isEditInfo || !isEditing}
            >
              <MdOutlineSaveAlt />
              บันทึก
            </button>
          </div>
        </div>
        <div className="space-edit-relationship">
          {/* relationship ทั้งหมด */}
          {relationshipStep.map((item, index) => {
            console.log("newRelationshipStep =", item);
            return (
              <div className="frame-edit-relationship" key={index}>
                <div className="btn-del-relationship">
                  <ImCross
                    onClick={() => handleDeleteRelationship(item.step_ID)}
                  />
                </div>
                <div>
                  {/* Dropdown Role1 */}
                  <div className="box-dropdown-edit-rela-step">
                    <div>
                      เลือกRoleย่อยของ "
                      {
                        allRole.find(
                          (role) => role._id === relationshipInfo.role_Sender_ID
                        )?.role_Name
                      }
                      "
                    </div>
                    <div key={item.step_ID} style={{ minWidth: 200 }}>
                      <select
                        value={item?.sub_Role_Sender_ID || ""}
                        onChange={(e) =>
                          handleChangeSubRoleSender(index, e.target.value)
                        }
                      >
                        {/* option dropdown1 */}
                        <option value="" disabled>
                          -
                        </option>

                        {allRole.map((role) => {
                          const isDisabled = relationshipStep.some((rel) => rel.sub_Role_Sender_ID === role._id);
                          if (role.main_Role_ID ===relationshipInfo.role_Sender_ID || relationshipInfo.role_Sender_ID === role._id) {
                            return (
                              <option
                                key={role._id}
                                value={role._id}
                                disabled={isDisabled}
                              >
                                {role.role_Name}
                              </option>
                            );
                          }
                          return null;
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="configure-arrow">
                  <div className="arrow-container">
                    <div className="arrow-line"></div>
                    <div className="arrow-head"></div>
                  </div>
                </div>
                <div>
                  {/* Dropdown Role2 */}
                  <div className="box-dropdown-edit-rela-step">
                    <div>
                      เลือกผู้อนุมัติของRole"
                      {
                        allRole.find(
                          (role) =>
                            role._id === relationshipInfo.role_Approval_ID
                        )?.role_Name
                      }
                      "
                    </div>
                    <div key={item.step_ID} style={{ minWidth: 200 }}>
                      <select
                        value={item?.Approver_ID || ""}
                        onChange={(e) =>
                          handleChangeApprover(index, e.target.value)
                        }
                      >
                        {/* เปลี่ยนเป็น คนในRole Approval */}
                        {/* option dropdown2 */}
                        <option value="" disabled>
                          -
                        </option>
                        {listApproverInfo.map((approver) => {
                          // const isDisabled = relationshipStep.some(rel => rel.Approver_ID === approver._id);
                          return (
                            <option
                              key={approver._id}
                              value={approver._id}
                              // disabled={isDisabled}
                            >
                              {approver.firstname} {approver.surname}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Overlay */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EditRelationship;

{
  /* Overlay */
}
{
  /* {isOpenConfigue && (
                <div className="configue-overlay">
                  <div className="configue-window">
                    <h3>เลือกประเภทความสัมพันธ์ระหว่าง</h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                    >
                      <div className="cf-rn">
                        <b>Roleที่1:</b>{" "}
                        {
                          allRole.find((role) => role._id === item.role1)?.role_Name
                        }
                      </div>
                      <FaArrowDown />
                      <div className="cf-rn">
                        <b>Roleที่2:</b>{" "}
                        {
                          allRole.find((role) => role._id === item.role2)?.role_Name
                        }
                      </div>
                    </div>

                    <div className="box-type">
                      <button
                        onClick={() => handleTypeRelationship("userSelect")}
                        title="ให้ผู้ใช้เลือกบุคคลในรายชื่อ"
                        className={
                          typeRelationship === "userSelect"
                            ? "btn-cf-type-active"
                            : "btn-cf-type"
                        }
                      >
                        User Select
                      </button>
                      <button
                        onClick={() => handleTypeRelationship("fixed")}
                        title="เป็นการเลือกบุคคลหนึ่งคนต่อกลุ่ม"
                        className={
                          typeRelationship === "fixed"
                            ? "btn-cf-type-active"
                            : "btn-cf-type"
                        }
                      >
                        Fixed
                      </button>
                    </div>
                    {typeRelationship === "fixed" && (
                      <FormControl
                        key={item.index}
                        sx={{ minWidth: 200, minHeight: "50px" }}
                      >
                        <Select
                          value={fixedPersonRole2}
                          onChange={(e) => handleChangefixedPersonRole2(e)}
                        >
                          {listRole2Selection
                            .sort((a, b) => {
                              const nameA = `${a.firstname} ${a.surname}`;
                              const nameB = `${b.firstname} ${b.surname}`;
                              return nameA.localeCompare(nameB); // Sort alphabetically
                            })
                            .map((user) => (
                              <MenuItem key={user._id} value={user._id}>
                                {user.firstname} {user.surname}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    )}
                    <div>
                      <button
                        onClick={() => handleCancelConfigue()}
                        className="btn-cancel"
                      >
                        ยกเลิก
                      </button>
                      <button
                        disabled={
                          !(
                            (typeRelationship === "fixed" &&
                              fixedPersonRole2 !== "") ||
                            typeRelationship === "userSelect"
                          )
                        }
                        className={
                          (typeRelationship === "fixed" &&
                            fixedPersonRole2 !== "") ||
                          typeRelationship === "userSelect"
                            ? "btn-enable"
                            : "btn-disable"
                        }
                        onClick={
                          (typeRelationship === "fixed" &&
                            fixedPersonRole2 !== "") ||
                          typeRelationship === "userSelect"
                            ? () => handleSubmitType(item)
                            : () => handleSubmitTypeError()
                        }
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              )} */
}

{
  /* {item.role1 && item.role2 && (
                    <button
                      className={
                        item.typeRelationship
                          ? "configure-button-value"
                          : "configure-button"
                      }
                      onClick={() => handleConfigueRelationship(item)}
                    >
                      {item.typeRelationship
                        ? item.typeRelationship
                        : "+ Configure"}
                    </button>
                  )} */
}

//ไว้เปลี่ยนค่า dropdown Role1 **เปลี่ยน
// const handleChangeRole1 = (itemIndex, selectedValue) => {
//   setRelationshipStep((prevRelationships) => {
//     const updatedRelationships = prevRelationships.map((relationshipStep) =>
//       relationshipStep.index === itemIndex
//         ? { ...relationshipStep, sub_Role_Sender_ID: selectedValue }
//         : relationshipStep
//     );
//     return updatedRelationships;
//   });
//   setIsEditing(true);
// };

// //ไว้เปลี่ยนค่า dropdown Role2 **เปลี่ยน
// const handleChangeRole2 = (itemIndex, selectedValue) => {
//   setRelationshipStep((prevRelationships) => {
//     const updatedRelationships = prevRelationships.map((relationshipStep) =>
//       relationshipStep.index === itemIndex
//         ? { ...relationshipStep, Approver_ID: selectedValue }
//         : relationshipStep
//     );
//     return updatedRelationships;
//   });
//   setIsEditing(true);
// };

//อาจจะเอาไว้ใช้ใน dropdown การอนุมัติแทน
// const handleConfigueRelationship = async () => {
//   const userData = JSON.parse(localStorage.getItem("userData"));
//   const response = await axios.post(
//     "http://localhost:5000/api/findUserByRoleID",
//     {
//       role_Approval_ID: relationshipInfo.role_Approval_ID,
//     },
//     {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: "Bearer " + userData.token,
//       },
//     }
//   );

//   // const results = response.data.results;
//   // setListRole2Selection(results);
//   // setIsEditing(true);
// };
