import React, { useEffect, useState, useMemo } from "react";
import "../styleCss/RoleStyle.css";
import "../styleCss/MyStyle.css";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoAlertCircleOutline } from "react-icons/io5";
import SelectionAddUsers from "./SelectionAddUsers";
import { useForkRef } from "@mui/material";

const WindowAddUserToRole = ({
  listUsers,
  onClickAddUser,
  personToAdd,
  setPersonToAdd,
}) => {
  return (
    <div className="window-overlay">
      <div className="window-add-users-to-role">
        <SelectionAddUsers
          listUsers={listUsers}
          personToAdd={personToAdd}
          setPersonToAdd={setPersonToAdd}
        />
        <div className="box-btn-access">
          <button onClick={() => onClickAddUser()}>ตกลง</button>
        </div>
      </div>
    </div>
  );
};

const TabDelete = ({ onClose, handleDelPersonInRole }) => {
  return (
    <div className="window-overlay">
      <div className="tab-del">
        <div className="tab-del-body">
          <IoAlertCircleOutline size={100} style={{ padding: 0 }} />
          <h2 style={{ padding: 0, margin: 0 }}>ลบรายการที่เลือกหรือไม่?</h2>
          <p style={{ padding: 0, margin: 0 }}>
            เมื่อลบแล้วรายการที่เลือกจะถูกนำออกทันที
          </p>
        </div>
        <div className="box-btn-tab-del">
          <button className="btn-cancel-del-user" onClick={() => onClose()}>
            ยกเลิก
          </button>
          <button
            className="btn-confirm-del-user"
            onClick={() => handleDelPersonInRole()}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};

const WindowSubRole = ({
  mainRole,
  sub_role_Name,
  subRole,
  setSub_Role_Name,
  onCloseSubRole,
  person,
  setPerson,
  handleconfirmSubRole,
}) => {
  const [selectedItems, setSelectedItems] = useState([]); //คนที่เลือกสำหรับจะลบออก -
  const [selectAll, setSelectAll] = useState(false); //เลือกทั้งหมด ใช้สำหรับตอนลบ -

  const [isOpenTabDelete, setIsOpenTabDelete] = useState(false); //ไว้เปิดปิดหน้าต่าง เตือน alert ก่อนลบ -

  const [selectPersonToAdd, setSelectPersonToAdd] = useState([]); //คนที่เลือกไว้ สำหรับ add เพิ่ม และนำมาโชว์ Pre View +
  const [isOpenSubWindow, setIsOpenSubWindow] = useState(false); //ไว้เปิดปิดหน้าต่าง add user +
  const [
    listUserInMainRoleWithOutSubRole,
    setListUserInMainRoleWithOutSubRole,
  ] = useState([]); //ไว้เก็บ user ที่ไม่ได้อยู่ใน subrole แต่อยู่ใน mainrole นี้ + (ตัวเลือก)

  //function ในการเลือกcheck box (เพื่อนำไปลบ) โดยใช้ item id
  const handleCheckboxChange = (itemId) => {
    if (selectAll) {
      // If "Select All" is checked, uncheck it and clear selected items
      setSelectAll(false);
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      // Otherwise, toggle the selected status of the clicked item
      const updatedSelectedItems = [...selectedItems];

      if (updatedSelectedItems.includes(itemId)) {
        updatedSelectedItems.splice(updatedSelectedItems.indexOf(itemId), 1);
      } else {
        updatedSelectedItems.push(itemId);
      }

      setSelectedItems(updatedSelectedItems);
    }
  };
  //function ในการเลือกทั้งหมด หรือไม่ทั้งหมด
  const handleSelectAllChange = () => {
    // Toggle the "Select All" status and clear or populate the selected items accordingly
    setSelectAll(!selectAll);
    setSelectedItems(selectAll ? [] : person.map((item) => item._id));
  };

  //เปิดหน้าต่าง Alert เตือนก่อนลบ
  const openTabDelete = () => {
    if (person.length === selectedItems.length) {
      alert("ไม่สามารถลบรายการทั้งหมดได้");
      setIsOpenTabDelete(false);
      return;
    }
    setIsOpenTabDelete(true);
  };
  //ปิดหน้าต่าง Alert เตือนก่อนลบ
  const onCloseTabDelete = () => {
    setIsOpenTabDelete(false);
  };

  //ปิดหน้าต่าง Add user
  function handleAddUserToRole() {
    setIsOpenSubWindow(false);
  }

  //function ในการจัดการการลบคนที่เลือกในตารางของ role_id นั้น
  const handleDelPersonInRole = async () => {
    // console.log("list uesr_id ที่ต้องหาในการลบ", selected); // console.log("role_id ที่ต้องหาในการลบ", role._id);
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      console.log("ก่อนไป api delete");
      console.log("ค่า subRole =", subRole?._id);
      console.log("ค่า role =");
      const response = await axios.post(
        "http://localhost:5000/api/delUserFromMainRoleUpdate",
        {
          listIdToDel: selectedItems,
          role_ID: subRole?._id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      // ยังไม่เสร็จ เหลือ fetch user ที่มาล่าสุดใหม่
      //call api by axios POST
      console.log("status delete:", response.data.status);
      console.log("because:", response.data.msg);
      console.log("ตัวไหนที่ลบไม่ได้ =", response.data?.items);
      if (response.data?.status === "can't delete") {
        setIsOpenTabDelete(false);
        const listCannotDeleteItems = response.data?.items;
        if (response.data.msg === "isApprover") {
          const listName = person.filter((user) =>
            listCannotDeleteItems.includes(user._id)
          );
          console.log("listName", listName);
          const alertMessage =
            "ไม่สามารถลบได้ เนื่องจากมี " +
            listName.map((item) => item.firstname).join(", ") +
            " อยู่ในผู้อนุมัติ";
          alert(alertMessage);
          return;
        } else {
          const listName = person.filter((user) =>
            listCannotDeleteItems.includes(user._id)
          );
          console.log("listName", listName);
          const alertMessage =
            "ไม่สามารถลบได้ เนื่องจากมี " +
            listName.map((item) => item.firstname).join(", ") +
            " อยู่ใน Roleย่อย";
          alert(alertMessage);

          return;
        }
      }
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
          setPerson(data.users);
        });
      //set ให้หน้าต่างปิด

      setIsOpenTabDelete(false);
    } catch (error) {
      console.log(error);
    }
  };

  async function handleManageWindowAdduser(listPerson) {
    const listUserID = listPerson.map((item, index) => item._id);
    const userData = JSON.parse(localStorage.getItem("userData"));
    const response = await axios.post(
      "http://localhost:5000/api/fetchUserInMainRoleWithOutSubRole",
      { listUserID, main_Role_ID: mainRole._id },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + userData.token,
        },
      }
    );
    setListUserInMainRoleWithOutSubRole(response.data.users);
    setIsOpenSubWindow(true);
  }

  return (
    <div className="window-overlay">
      <div className="window-add-role">
        <u>
          <h2>ชื่อRoleย่อย (Role หลัก : {mainRole?.role_Name})</h2>
        </u>
        <input
          className="textInput-role"
          type="text"
          placeholder="ชื่อ Role ย่อยที่ต้องการ"
          value={sub_role_Name}
          onChange={(event) => setSub_Role_Name(event.target.value)}
        ></input>
        <u>
          <h2>{person.length > 0 ? "รายชื่อทั้งหมด" : "ยังไม่มีรายชื่อ"}</h2>
        </u>
        <div className="frame-display-user-in-role">
          {person.length > 0 && (
            <div className="group-header">
              <div className="checkbox-input">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                />
              </div>
              <div className="header-table-person-column">ชื่อ</div>
              <div className="header-table-person-column">นามสกุล</div>
              <div className="header-table-person-column-width">อีเมล</div>
              <div className="header-table-person-column-narrow">สถานะ</div>
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {person.map((itemPerson, index) => {
              // console.log(item)
              return (
                <div key={index}>
                  <div className="group-person-in-role">
                    <div className="checkbox-input">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemPerson._id)}
                        onChange={() => handleCheckboxChange(itemPerson._id)}
                      />
                    </div>

                    <div className="header-table-person-column">
                      {itemPerson.firstname}
                    </div>
                    <div className="header-table-person-column">
                      {itemPerson.surname}
                    </div>
                    <div className="header-table-person-column-width">
                      {itemPerson.email}
                    </div>
                    <div className="header-table-person-column-narrow">
                      {itemPerson.isAdmin === 1 ? "Admin" : "User"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ปุ่มลบ */}
        <div className="frame-btn-del">
          {selectedItems.length !== 0 && (
            <button className="btn-del" onClick={() => openTabDelete()}>
              <DeleteIcon />
              <p>ลบรายการ</p>
            </button>
          )}
        </div>
        {/* ส่วนเพิ่มuser */}
        <div className="add-user-frame">
          <div>
            <u>
              <h2>รายชื่อที่ต้องการเพิ่ม</h2>
            </u>
          </div>
          {listUserInMainRoleWithOutSubRole.map((user, index) => {
            if (selectPersonToAdd.includes(user._id)) {
              return (
                <div key={index} className="display-user-to-add">
                  <div className="flex-width-300">
                    ชื่อ : {user.firstname} {user.surname}
                  </div>
                  <div className="flex-width-450">อีเมล : {user.email}</div>
                  <div className="checkbox-input">
                    {user.isAdmin === 1 ? "Admin" : "User"}
                  </div>
                </div>
              );
            }
          })}
        </div>
        <div className="window-role-bottom">
          <button
            className="btn-add-name"
            onClick={() => handleManageWindowAdduser(person)}
          >
            + เพิ่มรายชื่อ
          </button>
          <div className="box-btn-in-window">
            <button className="close-button" onClick={onCloseSubRole}>
              ยกเลิก
            </button>
            <button
              className="confirm-button"
              onClick={() => handleconfirmSubRole(selectPersonToAdd)}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
      {isOpenSubWindow && (
        <WindowAddUserToRole
          listUsers={listUserInMainRoleWithOutSubRole}
          onClickAddUser={handleAddUserToRole}
          personToAdd={selectPersonToAdd}
          setPersonToAdd={setSelectPersonToAdd}
        />
      )}
      {isOpenTabDelete && (
        <TabDelete
          onClose={onCloseTabDelete}
          handleDelPersonInRole={handleDelPersonInRole}
        />
      )}
    </div>
  );
};

export default WindowSubRole;
