import React from 'react';
import styles from "../css/Login.module.css"
import {Button, Checkbox, Form, Input} from "antd";
import {getLogin} from "../js/supabaseLogin.js";
import {useNavigate} from "react-router-dom";

function Login(props) {
    const {setLogin}=props;
    const [loading, setLoading] = React.useState(false);
    const [logState, setLogState] = React.useState(false);
    const navigate = useNavigate();
    const onFinish = async(values) => {
        setLoading(true);
        const {id,pw}=values;
        let login = await getLogin(id,pw,setLogin);
        if(login){
            setLogin(login);
            if(logState)localStorage.setItem("log",JSON.stringify(login));
            else sessionStorage.setItem("log",JSON.stringify(login));
            navigate("/");}
        setLoading(false);
    };
    return (
        <div className={styles.all_screen}>
            <div className={styles.container}>
                <img src="/images/ICECARE.png" height={"30vh"} alt="Login" />
                <div className={styles.login_form}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item label={"아이디"} name={"id"} rules={[{required:true,message:"아이디를 입력해주세요."}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label={"비밀번호"} name={"pw"} rules={[{required:true,message:"비밀번호를 입력해주세요"},{pattern:/[\s\S]{8,}/,message: "비밀번호는 최소 8자 이상입니다."},{pattern:/[!@#$%^&*]{1,}/,message:"특수문자를 포함하여주세요."}]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Checkbox onChange={()=>setLogState(!logState)}>
                            로그인 유지
                        </Checkbox>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>관리자로그인</Button>
                    </Form.Item>
                </Form>
                </div>
            </div>
        </div>
    );
}

export default Login;