import {supabase} from "./supabase.js";
import {notification} from "antd";
import bcrypt from "bcryptjs";
import axios from "axios";

const reqLogin = async (id) => {
  axios.defaults.withCredentials = true; // 쿠키를 허용하기 위해 설정
  const result = await axios.post('http://localhost:3000/back/login', {id}) // back06에 로그인 요청을 보냄
  console.log(result);
}

export const getLogin = async (id, pw) => {
  await reqLogin(id); // 서버에 로그인 요청을 보냄, 필요시 사용

  let res = await supabase.from("member").select("*").eq("id", id).single();
  if (res.error) {
    notification.error({
      message: "에러발생",
      description: `${res.error.code === 'PGRST116' ? '존재하지 않는 아이디입니다.' : res.error.details}`
    });
  } else {
    if (res.data.auth !== 1 && res.data.auth !== 9) notification.error({message: '권한부족', description: '관리자 계정이 아닙니다.'});
    else if (!await bcrypt.compare(pw.trim(), res.data.pw)) notification.error({
      message: '비밀번호 오류',
      description: '비밀번호가 틀렸습니다.'
    });
    else {
      notification.success({message: '로그인 성공'});
      return res.data;
    }
  }
  return false;
}