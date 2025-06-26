import React from "react";
import styles from "../css/Login.module.css";
import { Button, Checkbox, Form, Input, message } from "antd";
import { getLogin } from "../js/supabaseLogin.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app";

function Login(props) {
  const { setLogin } = props;
  const [loading, setLoading] = React.useState(false);
  const [logState, setLogState] = React.useState(false);
  const navigate = useNavigate();

  // PWA 푸시 구독 함수
  const subscribeToPush = async (userEmail) => {
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
  };

  // Base64 문자열을 Uint8Array로 변환하는 유틸리티 함수
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const onFinish = async (values) => {
    setLoading(true);
    const { id, pw } = values;
    let login = await getLogin(id, pw, setLogin);
    if (login) {
      setLogin(login);
      if (logState) localStorage.setItem("log", JSON.stringify(login));
      else sessionStorage.setItem("log", JSON.stringify(login));

      // 로그인 성공 후 푸시 구독 신청
      try {
        await subscribeToPush(login.mail);
      } catch (error) {
        console.error("푸시 구독 실패:", error);
      }

      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className={styles.all_screen}>
      <div className={styles.container}>
        <img src="/images/ICECARE.png" height={"30vh"} alt="Login" />
        <div className={styles.login_form}>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={"아이디"}
              name={"id"}
              rules={[{ required: true, message: "아이디를 입력해주세요." }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={"비밀번호"}
              name={"pw"}
              rules={[
                { required: true, message: "비밀번호를 입력해주세요" },
                {
                  pattern: /[\s\S]{8,}/,
                  message: "비밀번호는 최소 8자 이상입니다.",
                },
                {
                  pattern: /[!@#$%^&*]{1,}/,
                  message: "특수문자를 포함하여주세요.",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Checkbox onChange={() => setLogState(!logState)}>
                로그인 유지
              </Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                관리자로그인
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
