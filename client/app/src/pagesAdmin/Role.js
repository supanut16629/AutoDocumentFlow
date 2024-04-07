import React, { useEffect, useState, useMemo } from "react";
import { FaPlus } from "react-icons/fa6";
import axios from "axios";
import "../styleCss/RoleStyle.css";
import "../styleCss/MyStyle.css";
import { ImCross } from "react-icons/im";
import { IoMdArrowDropdownCircle, IoMdArrowDropupCircle } from "react-icons/io";
import { TiUserAdd } from "react-icons/ti";
import { FaUserGroup } from "react-icons/fa6";
import { IoAlertCircleOutline } from "react-icons/io5";
//component
import WindowSubRole from "../components/WindowSubRole";
import WindowRole from "../components/WindowRole";

////////
function Role() {
  const [isWindowRoleOpen, setIsWindowRoleOpen] = useState(false); //เปิดหน้าต่างแก้ไขบุคคลในRoleนั้นๆ
  const [allRole, setAllRole] = useState([]); //role ไว้ดึงข้อมูล Role ทั้งหมด  --ถ้า objectไหนมี main_Role_ID ให้เป็น Roleย่อยของ id นั้นๆ

  const [role, setRole] = useState(); //ข้อมูลRoleที่เลือก
  const [subRole, setSubRole] = useState(); //ข้อมูลsubRoleที่เลือก
  const [role_Name, setRole_Name] = useState(""); //ไว้เปลี่ยนชื่อ role_Name ของ id ที่เลือก
  const [sub_role_Name, setSub_Role_Name] = useState(""); //ไว้เปลี่ยนชื่อ role_Name ของ id ที่เลือก
  const [person, setPerson] = useState([]); //ทุกคนในroleนั้นๆ

  const [isListOpenSub, setIsListOpenSub] = useState([]);
  const [isWindowSubRoleOpen, setIsWindowSubRoleOpen] = useState(false);

  const [isWarningDeleteRole, setIsWarningDeleteRole] = useState(false); //เปิด-ปิด หน้าต่างalert ลบRole

  //function ในการดึงข้อมูล คนทั้งหมดใน role_ID นั้นๆ
  async function openWindow(item) {
    if (item) {
      const userData = JSON.parse(localStorage.getItem("userData"));
      //call api by axios POST
      await axios
        .post(
          "http://localhost:5000/api/fetchPersonFromRole",
          {
            role_ID: item._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          // console.log("setPerson =", data.users);
          setPerson(data.users);
        });
      // handleFetchUserInRole(item._id)
      setRole(item);
      setRole_Name(item.role_Name);
    } else {
      setRole([]);
      setRole_Name("");
    }

    setIsWindowRoleOpen(true);
  }

  //function ในการดึงข้อมูล คนทั้งหมดใน sub role_ID นั้นๆ
  async function openSubWindow(subRole, mainRole) {
    if (subRole) {
      const userData = JSON.parse(localStorage.getItem("userData"));
      //call api by axios POST
      await axios
        .post(
          "http://localhost:5000/api/fetchPersonFromRole",
          {
            role_ID: subRole._id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          // console.log("setPerson =", data.users);
          setPerson(data.users);
        });

      setRole(mainRole);
      setSubRole(subRole);
      setSub_Role_Name(subRole.role_Name);
    } else {
      setRole(mainRole);
      setSubRole([]);
      setSub_Role_Name("");
    }
    setIsWindowSubRoleOpen(true);
  }
  //function ในการออกจากหน้าต่างsubRoleแก้ไขแล้ว รีข้อมูลของ all role ใหม่ และเรียงลำดับตัวอักษร
  async function handleonCloseSubRole() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.get("http://localhost:5000/api/fetchRoles", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
      });
      const data = response.data.results;
      data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
      setAllRole(data);
    } catch (error) {
      console.log("closeWindow", error);
    }
    setIsWindowSubRoleOpen(false);
    setRole([]);
    setSubRole([]);
    setPerson([]);
  }

  //function ในการออกจากหน้าต่างแก้ไขแล้ว รีข้อมูลของ all role ใหม่ และเรียงลำดับตัวอักษร
  async function closeWindow() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.get("http://localhost:5000/api/fetchRoles", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
      });
      const data = response.data.results;
      data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
      setAllRole(data);
    } catch (error) {
      console.log("closeWindow", error);
    }
    setRole([]);
    setIsWindowRoleOpen(false);
    setPerson([]);
  }

  //function ในการเช็คเงื่อนไขต่างๆก่อน บันทึก (เช่น ชื่อมีมั้ย? ,มีroleอยู่แล้วหรือป่าว ถ้ามีupdate ถ้าไม่insertใหม่) และรีข้อมูลของ all role ใหม่
  async function handleconfirmRole(personToAdd) {
    console.log("ID =", role._id);
    console.log("Role", role);
    console.log("ชื่อRole :", role_Name);
    console.log("personToAdd :", personToAdd);

    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      //
      if (!role_Name?.trim()) {
        alert("กรุณาใส่ชื่อ Role");
        return;
      }
      //case มีroleอยู่แล้ว updateข้อมูล
      if (role?._id) {
        // console.log("go to api");
        await axios
          .put(
            `http://localhost:5000/api/updateRole/${role._id}`,
            {
              role_Name: role_Name,
              personToAdd: personToAdd,
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
            if (data.status === "name repeat") {
              alert("ชื่อ Role ซ้ำกรุณา ตั้งชื่ออีกครั้ง");
              return;
            }
          });
      }
      // สร้าง role ใหม่ต้องมี Personsก่อน
      else {
        console.log("ต้องสร้างRoleใหม่");
        if (personToAdd.length === 0) {
          alert(
            "ไม่สามารถสร้างRole ได้เนื่องจากไม่มีการเพิ่มรายชื่อ \nคุณสามารถกดเพิ่มรายชื่อที่มุมซ้ายล่างได้"
          );
          return;
        }
        //เรียก Api
        await axios
          .post(
            `http://localhost:5000/api/createRoleAndInsertPerson`,
            {
              role_Name: role_Name,
              personToAdd: personToAdd,
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
            if (data.status === "name repeat") {
              alert("ชื่อ Role ซ้ำกรุณา ตั้งชื่ออีกครั้ง");
              return;
            }
          });
      }

      //หลัง create หรือ update ข้อมูลเสร็จ
      const response = await axios.get("http://localhost:5000/api/fetchRoles", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
      });
      const data = response.data.results;
      data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
      setAllRole(data);
    } catch (error) {
      console.log("handleconfirmRoleERROR", error);
    }

    setIsWindowRoleOpen(false);
  }

  //function ในการเช็คเงื่อนไขต่างๆก่อน บันทึก subRole (เช่น ชื่อมีมั้ย? ,มีroleอยู่แล้วหรือป่าว ถ้ามีupdate ถ้าไม่insertใหม่) และรีข้อมูลของ all role ใหม่
  async function handleconfirmSubRole(selectPersonToAdd) {
    const userData = JSON.parse(localStorage.getItem("userData"));

    try {
      if (!sub_role_Name?.trim()) {
        alert("กรุณาใส่ชื่อ Role ย่อย");
        return;
      }
      //case มีroleอยู่แล้ว updateข้อมูล
      if (subRole?._id) {
        await axios
          .put(
            `http://localhost:5000/api/updateRole/${subRole._id}`,
            {
              role_Name: sub_role_Name,
              personToAdd: selectPersonToAdd,
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
            if (data.status === "name repeat") {
              alert("ชื่อ Role ซ้ำกรุณา ตั้งชื่ออีกครั้ง");
              return;
            }
          });
      }
      // สร้าง role ใหม่ต้องมี Personsก่อน
      else {
        if (selectPersonToAdd.length === 0) {
          alert(
            "ไม่สามารถสร้างRoleย่อย ได้เนื่องจากไม่มีการเพิ่มรายชื่อ \nคุณสามารถกดเพิ่มรายชื่อที่มุมซ้ายล่างได้"
          );
          return;
        }
        const response = await axios.post(
          `http://localhost:5000/api/createSubRoleAndUpdateMainRole`,
          {
            sub_role_Name: sub_role_Name,
            mainRole: role,
            selectPersonToAdd: selectPersonToAdd,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        if (response.data.status === "name repeat") {
          alert("ชื่อ Role ซ้ำกรุณา ตั้งชื่ออีกครั้ง");
          return;
        }
      }
      //หลัง create หรือ update ข้อมูลเสร็จ
      const responseFetchRoles = await axios.get(
        "http://localhost:5000/api/fetchRoles",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      const data = responseFetchRoles.data.results;
      data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
      setAllRole(data);
      setIsWindowSubRoleOpen(false);
    } catch (error) {
      console.log("error :", error);
    }
  }

  async function handleDeleteRole(roleToDelete) {
    console.log("roleToDelete", roleToDelete);
    const userData = JSON.parse(localStorage.getItem("userData"));
    const response = await axios.post(
      "http://localhost:5000/api/deleteRole",
      {
        roleToDelete,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
      }
    );
    const status = response.data.status;
    if (status === "can't delete role") {
      alert("ไม่สามารถลบได้ เนื่องจากRoleนี้อยู่ในความสัมพันธ์");
      setIsWarningDeleteRole(false)
      return;
    }

    setAllRole(response.data.newAllRole);
    setIsWarningDeleteRole(false)
  }

  const toggleListOpenSub = (index) => {
    setIsListOpenSub((prevState) => {
      const newState = [...prevState];
      newState[index] = !newState[index];
      return newState;
    });
  };

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
        data.sort((a, b) => a.role_Name.localeCompare(b.role_Name));
        // Update state with the fetched data
        if (!isEqual(data, allRole)) {
          // Update state only if the data is different
          setAllRole(data);
        }
        // console.log("allRole", allRole);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    }
    fetchRole();
  }, [allRole]);

  return (
    <div>
      <div
        className="container-window"
        style={{ width: "calc(100vw - 260px)" }}
      >
        <button
          className="btn-add-role"
          onClick={(e) => {
            e.stopPropagation();
            openWindow();
          }}
        >
          <FaPlus />
          <p> เพิ่มRoleใหม่</p>
        </button>
        <u>
          <h2>รายการของRole</h2>
        </u>

        <div style={{ width: "calc(100vw - 260px)" }}>
          {allRole.map((mainRole, index) => {
            if (!mainRole.main_Role_ID) {
              return (
                <div key={index}>
                  <div
                    className="role-box"
                    onClick={() => openWindow(mainRole)}
                  >
                    <p style={{ display: "flex", flex: 10 }}>
                      <FaUserGroup style={{ marginRight: "0.5rem" }} />{" "}
                      {mainRole.role_Name}
                    </p>
                    <p style={{ display: "flex", flex: 2 }}>
                      จำนวน {mainRole.number_Of_People} คน
                    </p>
                    <div className="box-of-add-sub-role">
                      <button
                        className="btn-add-sub-role"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSubWindow(null, mainRole);
                        }}
                      >
                        <TiUserAdd />
                        เพิ่มRoleย่อย
                      </button>
                    </div>
                    <div className="box-del-role">
                      {mainRole.sub_Role_List_ID?.length > 0 ? (
                        isListOpenSub[index] ? (
                          <IoMdArrowDropupCircle
                            className="btn-cross"
                            size={15}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleListOpenSub(index);
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdownCircle
                            className="btn-cross"
                            size={15}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleListOpenSub(index);
                            }}
                          />
                        )
                      ) : (
                        <ImCross
                          className="btn-cross"
                          size={12}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsWarningDeleteRole(mainRole)
                            // handleDeleteRole(mainRole);
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {isListOpenSub[index] && (
                    <div className="space-sub-role">
                      <div className="space-center-sub-role">
                        {allRole.map((subRole, indexSubRole) => {
                          if (subRole.main_Role_ID === mainRole._id) {
                            return (
                              <div
                                key={indexSubRole}
                                className="box-sub-role"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSubWindow(subRole, mainRole);
                                }}
                              >
                                <div style={{ display: "flex", flex: 8 }}>
                                  {subRole.role_Name}
                                </div>
                                <div style={{ display: "flex", flex: 2 }}>
                                  จำนวน {subRole.number_Of_People} คน
                                </div>
                                <ImCross
                                  className="btn-cross"
                                  size={12}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsWarningDeleteRole(subRole)
                                    // handleDeleteRole(subRole);
                                  }}
                                />
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      </div>
      {isWindowRoleOpen && (
        <WindowRole
          onClose={closeWindow}
          handleconfirmRole={handleconfirmRole}
          role={role}
          role_Name={role_Name}
          setRole_Name={setRole_Name}
          person={person}
          setPerson={setPerson}
        />
      )}
      {isWindowSubRoleOpen && (
        <WindowSubRole
          mainRole={role}
          sub_role_Name={sub_role_Name}
          subRole={subRole}
          setSub_Role_Name={setSub_Role_Name}
          onCloseSubRole={handleonCloseSubRole}
          person={person}
          setPerson={setPerson}
          handleconfirmSubRole={handleconfirmSubRole}
        />
      )}
      {isWarningDeleteRole && (
        <div className="window-overlay">
          <div className="tab-del">
            <div className="tab-del-body">
              <IoAlertCircleOutline size={100} style={{ padding: 0 }} />
              <h2 style={{ padding: 0, margin: 0 }}>
                ลบรายการที่เลือกหรือไม่?
              </h2>
              <p style={{ padding: 0, margin: 0 }}>
                เมื่อลบแล้วรายการที่เลือกจะถูกนำออกทันที
              </p>
            </div>
            <div className="box-btn-tab-del">
              <button className="btn-cancel-del-user" onClick={()=>setIsWarningDeleteRole(false)}>
                ยกเลิก
              </button>
              <button
                className="btn-confirm-del-user"
                onClick={() => handleDeleteRole(isWarningDeleteRole)}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Role;
