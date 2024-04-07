import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";

//Icon
import { GiHamburgerMenu } from "react-icons/gi";
import * as FaIcon from "react-icons/fa";
import { PiUserSwitchBold } from "react-icons/pi";
import { CiCirclePlus } from "react-icons/ci";
import { TiFlowMerge } from "react-icons/ti";
import { PiGraphBold } from "react-icons/pi";
import { VscGitPullRequestCreate } from "react-icons/vsc";
import { MdAccountCircle } from "react-icons/md";
import { RiLogoutBoxRFill } from "react-icons/ri";
import { FaGear } from "react-icons/fa6";
import { TiGroup } from "react-icons/ti";
import { RiAdminFill } from "react-icons/ri";

import { useDispatch, useSelector } from "react-redux";
import "../styleCss/SideBarNHeader.css";
import "../styleCss/MyStyle.css";
function SidebarAdmin({ children }) {
  const navigate = useNavigate();
  const [toggleLogOut, setToggleLogOut] = useState(false);
  const [isOpenSideBar, setIsOpenSideBar] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  // const userData = useSelector((state) => state.account[0]);

  const [userInfo, setUserInfo] = useState({
    firstname: "",
    surname: "",
    isAdmin: 1,
  });

  const menuItem = [
    {
      path: "/admin/",
      title: "Home",
      icon: <FaIcon.FaHome />,
    },
    {
      path: "/admin/myFlow",
      title: "My Flow",
      icon: <TiFlowMerge />,
    },
    {
      path: "/admin/createFlow",
      title: "Create Flow",
      icon: <CiCirclePlus />,
    },
    {
      path: "/admin/relation",
      title: "Relationship",
      icon: <PiGraphBold />,
    },
    {
      path: "/admin/createRelation",
      title: "Create Relationship",
      icon: <VscGitPullRequestCreate />,
    },
    {
      path: "/admin/role",
      title: "Role",
      icon: <TiGroup />,
    },
    {
      path: "/main/",
      title: "Switch to User",
      icon: <PiUserSwitchBold />,
    },
  ];

  // const toggleSideBar = () => setIsOpenSideBar(!isOpenSideBar);
  const toggleSideBar = () => console.log("!isOpenSideBar");
  function toggleBtnLogOut() {
    return setToggleLogOut(!toggleLogOut);
  }

  function handleLogOut() {
    localStorage.removeItem("userData");
    setUserInfo({ firstname: "", surname: "", isAdmin: 1 });
    navigate("/");
  }

  const handleNavLinkClick = (newPath) => {
    setCurrentPath(newPath);
  };

  

  useEffect(() => {
    async function verifyToken() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!userData) {
        localStorage.removeItem("userData");
        navigate("/");
        return;
      }
      if (userData.data.isAdmin !== 1) {
        navigate("/main");
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
  //     setUserInfo({
  //       firstname: userData.firstname,
  //       surname: userData.surname,
  //       isAdmin: userData.isAdmin,
  //     });
  //   }
  //   fetchUserInfo();
  // }, []);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [window.location.pathname]);

  useEffect(()=>{
  //   console.log("Current Path:", currentPath);
  // console.log("Navigating to:", navigate);
  },[currentPath, navigate])
  return (
    <div className="container-all">
      <div className="headerAdmin">
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            paddingLeft: "1rem",
          }}
        >
          <RiAdminFill className="logoAdmin" />
          <div className="textAdmin">Administrator</div>
          <div>
            ชื่อผู้ใช้ : {userInfo.firstname} {userInfo.surname}
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
            const colorItemSelected = "#4F66AA";
            return (
              <NavLink
                to={item.path}
                key={index}
                className="linkAdmin"
                title={item.title}
                style={{
                  backgroundColor:
                    item.path === currentPath ? colorItemSelected : "#DBE2E9",
                }}
                onClick={() => handleNavLinkClick(item.path)}
              >
                <div className="icon">{item.icon}</div>
                {isOpenSideBar && <div className="titleName">{item.title}</div>}
              </NavLink>
            );
          })}
        </div>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}

export default SidebarAdmin;
