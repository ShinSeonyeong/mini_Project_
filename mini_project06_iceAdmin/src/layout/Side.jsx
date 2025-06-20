import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import sideMenu from "../js/sideMenu.js";
import { AutoComplete } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const styles = {
  adminInfo: {
    padding: "20px",
    background: "#ffffff",
    borderRadius: "8px",
    marginBottom: "50px",
    marginTop: "20px",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  profileImage: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
  },
  adminDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  adminId: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  adminIdH4: {
    color: "#595959",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
    width: "60px",
  },
  adminIdH5: {
    color: "black",
    fontSize: "15px",
    fontWeight: "500",
    margin: 0,
    background: "#f5f5f5",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  adminAuth: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  adminAuthH4: {
    color: "#595959",
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
    width: "60px",
  },
  adminAuthH5: {
    color: "#1890ff",
    fontSize: "15px",
    fontWeight: "500",
    margin: 0,
    background: "#e6f7ff",
    padding: "2px 8px",
    borderRadius: "4px",
  },
};

function Side({ toggleAside, setToggleAside, login }) {
  const location = useLocation();
  const [currentSide, setCurrentSide] = useState(() => {
    // URL 경로에 따라 초기 상태 설정
    const path = location.pathname;
    if (path === "/") return "dashboard";
    if (path === "/contact") return "contact";
    if (path === "/reservation") return "reservation";
    if (path === "/popup") return "popup";
    if (path === "/employee") return "employee";
    if (path === "/customer") return "customer";
    return "dashboard";
  });
  const sideNav = useNavigate();

  // URL이 변경될 때마다 currentSide 업데이트
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setCurrentSide("dashboard");
    else if (path === "/contact") setCurrentSide("contact");
    else if (path === "/reservation") setCurrentSide("reservation");
    else if (path === "/popup") setCurrentSide("popup");
    else if (path === "/employee") setCurrentSide("employee");
    else if (path === "/customer") setCurrentSide("customer");
  }, [location.pathname]);

  return (
    <>
      <aside className={`login ${toggleAside ? "toggleSide" : ""}`}>
        <div className={`${toggleAside ? "toggleSide" : ""}`}>
          <CloseCircleOutlined
            style={{
              fontSize: "30px",
              position: "absolute",
              right: "20px",
              top: "20px",
            }}
            onClick={() => {
              setToggleAside(!toggleAside);
            }}
          />
        </div>
        <div style={styles.adminInfo}>
          <div style={styles.adminProfile}>
            <img
              src="/images/admin-profile.jpg"
              alt="Admin Profile"
              style={styles.profileImage}
            />
            <div style={styles.adminDetails}>
              <div style={styles.adminId}>
                <h4 style={styles.adminIdH4}>ID</h4>
                <h5 style={styles.adminIdH5}>{login.id}</h5>
              </div>
              <div style={styles.adminAuth}>
                <h4 style={styles.adminAuthH4}>AUTH</h4>
                <h5 style={styles.adminAuthH5}>
                  {login.auth === 9 ? "최고관리자" : "관리자"}
                </h5>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <NavLink style={{ marginInlineStart: "20px" }} to="/">
            <img src="/images/side_logo.png" width={180} alt="Logo" />
          </NavLink>
          <h2 style={{marginInlineStart: "20px"}}>관리자 센터</h2>
        </div>

        <nav>
          <div>
            <div
              className={`${currentSide === "dashboard" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("dashboard");
                setToggleAside(!toggleAside);
                sideNav("/");
              }}
            >
              <h3>대시보드</h3>
            </div>
          </div>

          <div>
            <div
              className={`${currentSide === "contact" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("contact");
                setToggleAside(!toggleAside);
                sideNav("/contact");
              }}
            >
              <h3>게시판</h3>
            </div>
          </div>
          <div>
            <div
              className={`${currentSide === "reservation" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("reservation");
                setToggleAside(!toggleAside);
                sideNav("/reservation");
              }}
            >
              <h3>예약관리</h3>
            </div>
          </div>
          
          <div>
            <div
              className={`${currentSide === "employee" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("employee");
                setToggleAside(!toggleAside);
                sideNav("/employee");
              }}
            >
              <h3>직원관리</h3>
            </div>
          </div>
          <div>
            <div
              className={`${currentSide === "customer" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("customer");
                setToggleAside(!toggleAside);
                sideNav("/customer");
              }}
            >
              <h3>고객관리</h3>
            </div>
          </div>
          <div>
            <div
              className={`${currentSide === "popup" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("popup");
                setToggleAside(!toggleAside);
                sideNav("/popup");
              }}
            >
              <h3>팝업관리</h3>
            </div>
          </div>
          {/* <div>
            <div
              className={`${currentSide === "employee" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("employee");
                setToggleAside(!toggleAside);
                sideNav("/");
              }}
            >
              <h3>점주관리</h3>
            </div>
          </div>
          <div>
            <div
              className={`${currentSide === "employee" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("employee");
                setToggleAside(!toggleAside);
                sideNav("/");
              }}
            >
              <h3>기사관리</h3>
            </div>
          </div> */}
        </nav>
      </aside>
    </>
  );
}

export default Side;
