import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import sideMenu from "../js/sideMenu.js";
import { AutoComplete } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const styles = {
  adminInfo: {
    padding: "20px",
    background: "transparent",
    marginBottom: "20px",
    marginTop: "20px",
    marginInline: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  profileImage: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  adminDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  adminId: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  adminIdH4: {
    color: "#6c757d",
    fontSize: "12px",
    fontWeight: "600",
    margin: 0,
    width: "40px",
  },
  adminIdH5: {
    color: "#1890ff",
    fontSize: "15px",
    fontWeight: "400",
    margin: 0,
  },
  adminAuth: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  adminAuthH4: {
    color: "#6c757d",
    fontSize: "12px",
    fontWeight: "600",
    margin: 0,
    width: "40px",
  },
  adminAuthH5: {
    color: "#1890ff",
    fontSize: "15px",
    fontWeight: "400",
    margin: 0,
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
        <div className="close-button-container">
          <CloseCircleOutlined
            className="close-button"
            style={{
              fontSize: "24px",
              position: "absolute",
              right: "20px",
              top: "20px",
              cursor: "pointer",
              zIndex: 1000,
              color: "#6c757d",
              transition: "color 0.3s ease",
              ":hover": {
                color: "#1890ff",
              },
            }}
            onClick={() => {
              setToggleAside(true);
            }}
          />
        </div>
        <div style={styles.adminInfo}>
          <div style={styles.adminProfile}>
            <img
              src="/images/admin-profile.png"
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

        <div style={{ marginBottom: "20px", marginLeft: "20px", }}>
          <NavLink
            style={{
              display: "block",
              marginBottom: "10px",
            }}
            to="/"
          >
            <img
              src="/images/ICECARE.png"
              style={{
                width: "140px",
                height: "auto",
                marginBottom: "5px",
              }}
              alt="Logo"
            />
          </NavLink>
          <h2
            style={{
              fontSize: "25px",
              color: "#fff",
              fontWeight: "500",
              margin: "0",
            }}
          >
            관리자 센터
          </h2>
        </div>

        <nav
          style={{
            marginTop: "20px",
            width: "100%",
          }}
        >
          <div>
            <div
              className={`${currentSide === "dashboard" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("dashboard");
                setToggleAside(true);
                sideNav("/");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>대시보드</h3>
            </div>
          </div>

          <div>
            <div
              className={`${currentSide === "contact" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("contact");
                setToggleAside(true);
                sideNav("/contact");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>게시판</h3>
            </div>
          </div>

          <div>
            <div
              className={`${currentSide === "reservation" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("reservation");
                setToggleAside(true);
                sideNav("/reservation");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>예약관리</h3>
            </div>
          </div>

          <div>
            <div
              className={`${currentSide === "employee" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("employee");
                setToggleAside(true);
                sideNav("/employee");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>직원관리</h3>
            </div>
          </div>

          <div>
            <div
              className={`${currentSide === "customer" ? "select" : ""}`}
              onClick={() => {
                setCurrentSide("customer");
                setToggleAside(true);
                sideNav("/customer");
              }}
              style={{
                padding: "12px 20px",
                borderRadius: "8px",
                transition: "background-color 0.3s ease",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px" }}>고객관리</h3>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Side;
