import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styleCss/RoleStyle.css";
import "../styleCss/MyStyle.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoAlertCircleOutline } from "react-icons/io5";
import SelectionAddUsers from "./SelectionAddUsers";
import ReactPaginate from "react-paginate";
import { DataGrid } from "@mui/x-data-grid";

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

const columns = [
  { field: "firstname", headerName: "ชื่อ", width: 130 },
  { field: "surname", headerName: "นามสกุล", width: 130 },
  { field: "email", headerName: "อีเมล", width: 200 },
];

const WindowRole = ({
  onClose,
  handleconfirmRole,
  role,
  role_Name,
  setRole_Name,
  person,
  setPerson,
}) => {
  const [listPersonWithOutRole, setListPersonWithOutRole] = useState([]); // ไว้เก็บ user ที่ไม่ได้อยู่ใน role นี้ + (ตัวเลือก)
  const [isOpenSubWindow, setIsOpenSubWindow] = useState(false); //ไว้เปิดปิดหน้าต่าง add user +
  const [personToAdd, setPersonToAdd] = useState([]); //คนที่เลือกไว้ สำหรับ add เพิ่ม และนำมาโชว์ Pre View +
  const [selectedItems, setSelectedItems] = useState([]); //คนที่เลือกสำหรับจะลบออก -
  const [selectAll, setSelectAll] = useState(false); //เลือกทั้งหมด ใช้สำหรับตอนลบ -
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const pagesVisited = currentPage * itemsPerPage;

  const [isOpenTabDelete, setIsOpenTabDelete] = useState(false); //ไว้เปิดปิดหน้าต่าง เตือน alert ก่อนลบ -

  const displayData = person.slice(pagesVisited, pagesVisited + itemsPerPage);

  const pageCount = Math.ceil(person.length / itemsPerPage);

  const changePage = ({ selected }) => {
    setCurrentPage(selected);
  };
  ////////////////

  async function handleManageWindowAdduser(usersInRole) {
    const listUserInRoleID = usersInRole.map((item, index) => item._id);
    // console.log(listUserInRoleID);
    const userData = JSON.parse(localStorage.getItem("userData"));
    await axios
      .post(
        "http://localhost:5000/api/fetchUserWithOutRole",
        { listUserInRoleID },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      )
      .then((res) => res.data)
      .then((data) => {
        setListPersonWithOutRole(data.users);
      });
    setIsOpenSubWindow(true);
  }

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
    // console.log("list uesr_id ที่ต้องหาในการลบ", selected);
    // console.log("role_id ที่ต้องหาในการลบ", role._id);
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.post(
        "http://localhost:5000/api/delUserFromMainRoleUpdate",
        {
          listIdToDel: selectedItems,
          role_ID: role._id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      console.log("status delete:", response.data.status);
      console.log("because:", response.data.msg);
      console.log("ตัวไหนที่ลบไม่ได้ =", response.data?.items);
      //ยังไม่เสร็จ เหลือ fetch user ที่มาล่าสุดใหม่
      //call api by axios POST
      onCloseTabDelete();
      if (response.data?.status === "can't delete") {
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
            role_ID: role._id,
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
          //   console.log("setPerson =", data.users);
          setPerson(data.users);
        });
      //set ให้หน้าต่างปิด
      onCloseTabDelete();
    } catch (error) {
      console.log(error);
    }
  };

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

  const getRowId = (row) => row._id;

  return (
    <>
      <div className="window-overlay">
        <div className="window-add-role">
          {/* ชื่อRole */}
          <u>
            <h2>ชื่อ Role</h2>
          </u>
          <input
            className="textInput-role"
            type="text"
            placeholder="ชื่อ Role ที่ต้องการ"
            value={role_Name}
            onChange={(event) => setRole_Name(event.target.value)}
          ></input>
          {/* รายชื่อในRole */}
          <u>
            <h2>{person.length > 0 ? "รายชื่อทั้งหมด" : "ยังไม่มีรายชื่อ"}</h2>
          </u>
          {/* ตารางรายชื่อในRole */}
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
              {person.map((item, index) => {
                // console.log(item)
                return (
                  <div key={index}>
                    <div className="group-person-in-role">
                      <div className="checkbox-input">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleCheckboxChange(item._id)}
                        />
                      </div>

                      <div className="header-table-person-column">
                        {item.firstname}
                      </div>
                      <div className="header-table-person-column">
                        {item.surname}
                      </div>
                      <div className="header-table-person-column-width">
                        {item.email}
                      </div>
                      <div className="header-table-person-column-narrow">
                        {item.isAdmin === 1 ? "Admin" : "User"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* <div className="frame-display-user-in-role">
          <table className="">
            <thead>
              <tr className="">
                <th className="">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                  />
                </th>
                <th className="">ชื่อ</th>
                <th className="">นามสกุล</th>
                <th className="">อีเมล</th>
                <th className="">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {person.map((item, index) => {
                return (
                  <tr key={index} className="">
                    <td className="checkbox-input">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleCheckboxChange(item._id)}
                      />
                    </td>
                    <td>{item.firstname}</td>
                    <td>{item.surname}</td>
                    <td>{item.email}</td>
                    <td>{item.isAdmin === 1 ? "Admin" : "User"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div> */}
          {/* <div className="frame-display-user-in-role">
            <DataGrid
              sx={{maxHeight:400}}
              rows={person}
              columns={columns}
              getRowId={getRowId}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5]}
              checkboxSelection
            />
          </div> */}
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
            {listPersonWithOutRole.map((item, index) => {
              if (personToAdd.includes(item._id)) {
                return (
                  <div key={index} className="display-user-to-add">
                    <div className="flex-width-300">
                      ชื่อ : {item.firstname} {item.surname}
                    </div>
                    <div className="flex-width-450">อีเมล : {item.email}</div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {item.isAdmin === 1 ? "Admin" : "User"}
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
              <button className="close-button" onClick={onClose}>
                ยกเลิก
              </button>
              <button
                className="confirm-button"
                onClick={() => handleconfirmRole(personToAdd)}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
        {isOpenSubWindow && (
          <WindowAddUserToRole
            listUsers={listPersonWithOutRole}
            onClickAddUser={handleAddUserToRole}
            personToAdd={personToAdd}
            setPersonToAdd={setPersonToAdd}
          />
        )}
        {isOpenTabDelete && (
          <TabDelete
            onClose={onCloseTabDelete}
            handleDelPersonInRole={handleDelPersonInRole}
          />
        )}
      </div>
    </>
  );
};

export default WindowRole;
