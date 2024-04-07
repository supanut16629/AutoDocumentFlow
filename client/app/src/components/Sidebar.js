import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";

//Icon
import * as FaIcon from "react-icons/fa";
import * as Io5Icon from "react-icons/io5";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaRegStar } from "react-icons/fa6";
import { FaBarsProgress } from "react-icons/fa6";
import { MdAdminPanelSettings } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { RiLogoutBoxRFill } from "react-icons/ri";
import { IoCheckmarkCircle } from "react-icons/io5";
import { FaGear } from "react-icons/fa6";

import "../styleCss/SideBarNHeader.css";
import "../styleCss/MyStyle.css";

import { useDispatch, useSelector } from "react-redux";
import { logOut } from "../redux/slice/accountSlice";

function Sidebar({ children }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [toggleLogOut, setToggleLogOut] = useState(false);
  const [isOpenSideBar, setIsOpenSideBar] = useState(true);
  const [currentPath, setCurrentPath] = useState("/main");
  // const userData = useSelector((state) => state.account);
  // console.log("global",userData)
  //Ex
  const [userInfo, setUserInfo] = useState({
    firstname: "",
    surname: "",
    isAdmin: 1,
  });
  ////////////
  const menuItem = [
    {
      path: "/main/",
      title: "Home",
      icon: <FaIcon.FaHome />,
    },
    {
      path: "/main/docFlow",
      title: "Document Flow",
      icon: <Io5Icon.IoDocumentText />,
    },
    {
      path: "/main/faFlow",
      title: "Favorite Flow",
      icon: <FaRegStar />,
    },
    {
      path: "/main/approval",
      title: "Approval",
      icon: <IoCheckmarkCircle />,
    },
    {
      path: "/main/progress",
      title: "Progress",
      icon: <FaBarsProgress />,
    },
    {
      path: "/main/history",
      title: "History",
      icon: <FaIcon.FaHistory />,
    },
    {
      path: "/admin/",
      title: "Admin Management",
      icon: <MdAdminPanelSettings />,
    },
  ];

  // const toggleSideBar = () => setIsOpenSideBar(!isOpenSideBar);
  const toggleSideBar = () => console.log("!isOpenSideBar");
  function toggleBtnLogOut() {
    return setToggleLogOut(!toggleLogOut);
  }
  function handleLogOut() {
    localStorage.removeItem("userData");
    //delete from redux state
    // dispatch(logOut());
    setUserInfo({ firstname: "", surname: "", isAdmin: 0 });
    navigate("/");
  }

  const handleNavLinkClick = (newPath) => {
    setCurrentPath(newPath);
  };

  //useEffect load redux state


  useEffect(() => {
    async function verifyToken() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!userData) {
        localStorage.removeItem("userData");
        navigate("/");
        return;
      }
      await axios
        .post(
          "http://localhost:5000/auth/verify",
          {},
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        )
        .then((response) => response.data)
        .then((data) => {
          if (data.status === "ok") {
            console.log("auth success");
            console.log("auth ",userData.data);
            setUserInfo({
              firstname: userData.data.firstname,
              surname: userData.data.surname,
              isAdmin: userData.data.isAdmin,
            });
            

          } else {
            console.log("auth fail");
            localStorage.removeItem("userData");
            navigate("/");
          }
        })
        .catch((error) => console.error("err : ", error));
    }
    verifyToken();
  }, []);


  // useEffect(() => {
  //   async function fetchUserInfo() {
  //     console.log("userData from useSelector :", userData);
  //     setUserInfo({
  //       firstname: userData.firstname,
  //       surname: userData.surname,
  //       isAdmin: userData.isAdmin,
  //     });
  //   }
  //   fetchUserInfo();
  //   console.log("userInfo from State :", userInfo);
  // }, [userData]);


  useEffect(() => {
    console.log(currentPath);
    setCurrentPath(window.location.pathname);
  }, [window.location.pathname]);
  return (
    <div className="container-all">
      <div className="header">
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            paddingLeft: "1rem",
          }}
        >
          <div>
            ชื่อผู้ใช้: {userInfo.firstname ?? userInfo.firstname } {userInfo.surname ?? userInfo.surname}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "flex-end",
            alignItems: "center",
            paddingRight: "1rem",
          }}
        >
          <MdAccountCircle
            className={
              toggleLogOut === false ? "btn-toggleLogOut" : "btn-toggleLogOut2"
            }
            size={30}
            onClick={() => toggleBtnLogOut()}
          />
          {toggleLogOut && (
            <div className="boxDropdown">
              <div onClick={() => handleLogOut()} className="dropdownLogout">
                <RiLogoutBoxRFill />
                <div style={{ paddingLeft: 10 }}>ออกจากระบบ</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="body">
        <div className={isOpenSideBar ? "container" : "container-narrow"}>
          <div className="top-corner">
            <GiHamburgerMenu
              size={20}
              className="hamburgerMenu"
              onClick={toggleSideBar}
            />
          </div>
          {menuItem.map((item, index) => {
            if (item.title !== "Admin Management" || userInfo.isAdmin === 1) {
              const colorItemSelected = "#1070C6";
              return (
                <NavLink
                  to={item.path}
                  key={index}
                  className="link"
                  title={!isOpenSideBar ? item.title : ""}
                  style={{
                    backgroundColor:
                      item.path === currentPath ||
                      item.path === currentPath + "/"
                        ? colorItemSelected
                        : "#DBE2E9",
                  }}
                  onClick={() => handleNavLinkClick(item.path)}
                >
                  <div className="icon">{item.icon}</div>
                  {isOpenSideBar && (
                    <div className="titleName">{item.title}</div>
                  )}
                </NavLink>
              );
            }
          })}
        </div>
        <main>
          {children}
        </main>
      </div> 
    </div>
  );
}

export default Sidebar;
