import { useEffect, useState } from "react";
import "./App.css";
import Side from "./layout/Side.jsx";
import Body from "./layout/Body.jsx";
import LogoutIcon from "@mui/icons-material/Logout";
import { MenuUnfoldOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const LOCAL_API_URL = "http://192.168.0.113:4000";
const API_URL = "https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app";

function App() {
  const [toggleAside, setToggleAside] = useState(true);
  const [login, setLogin] = useState("");
  let navigate = useNavigate();

  function isValidJson(item) {
    try {
      JSON.parse(item);
      return true;
    } catch (e) {
      return false;
    }
  }

  //   https://github.com/dron512/pwa/tree/test-main/react_work/front02
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      // console.log("service worker after");
      navigator.serviceWorker.ready.then((registration) => {
        // console.log("service worker ready");
        registration.pushManager
          .subscribe({
            userVisibleOnly: true,
            // 공개키 설정 - mobile에서 푸시 받을 때 사용(모바일에서 가져온 공개키)
            applicationServerKey:
              "BBAM2GOE13h59ZDNqToC23HdNafs2eypet_bh6sRh0wvxIbZknpiVijBqrSealSwYBkBLyTE_DTQmzmp8yTDCZE",
          })
          .then((subscription) => {
            // console.log(subscription);
            return fetch(`${API_URL}/push/subscribe`, {
              //   return fetch(`${API_URL}/push/subscribe`, {
              method: "POST",
              body: JSON.stringify(subscription),
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then((response) => {
                return response.json();
              })
              .then((data) => {
                console.log(data);
              });
          })
          .catch((error) => {
            console.error("푸시 구독 실패:", error);
          });
      });
    }

    window.scrollTo({ top: 0, left: 0 });

    if (
      localStorage.getItem("log") &&
      isValidJson(localStorage.getItem("log"))
    ) {
      setLogin(JSON.parse(localStorage.getItem("log")));
    } else if (
      sessionStorage.getItem("log") &&
      isValidJson(sessionStorage.getItem("log"))
    ) {
      setLogin(JSON.parse(sessionStorage.getItem("log")));
    } else if (!login) navigate("/login");
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLogin("");
    navigate("/login");
  };
  return (
    <>
      {login ? (
        <>
          <Side
            toggleAside={toggleAside}
            setToggleAside={setToggleAside}
            login={login}
          />
          <main className="login">
            <nav>
              <section>
                <MenuUnfoldOutlined
                  style={{ fontSize: "32px" }}
                  onClick={() => {
                    setToggleAside(!toggleAside);
                  }}
                />
                <LogoutIcon
                  style={{ fontSize: "40px", cursor: "pointer" }}
                  onClick={logout}
                />
              </section>
            </nav>
            <div>
              <Body setLogin={setLogin} />
            </div>
          </main>
        </>
      ) : (
        <div>
          <Body setLogin={setLogin} />
        </div>
      )}
    </>
  );
}

export default App;
