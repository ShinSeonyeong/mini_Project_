import {supabase} from "./supabase.js";
import {message, notification} from "antd";
import bcrypt from "bcryptjs";

export const getEmpl = async(type,nm)=>{
    let query = supabase.from("member").select("*");
    if(type){
        query = query.eq("type",type);
    }
    if(nm){
        query = query.ilike("nm","%"+nm+"%");
    }
    let res = await query;
    if(res.error){
        notification.error({message:"에러발생:"+res.error});
    }
    console.log(res);
    return res.data;
}

export const profileUpload = async (file,isModify,props) =>{
    if(file.originFileObj){
        const fileExt = file.name.split('.').pop(); // 파일 확장자 추출
        const fileName = `${Date.now()}.${fileExt}`; // 현재 시간으로 파일 이름 생성
        const filePath = `profile-images/${fileName}`; // supabase storage에 저장할 경로 지정

        const {error: uploadError} = await supabase.storage
            .from('icecarebucket') // 저장할 버킷 이름은 board-images
            .upload(filePath, file); // 파일 업로드

        if (uploadError) {
            message.error("이미지 업로드에 실피했습니다.");
            return null;
        }

        const {data} = supabase.storage // 업로드한 파일의 URL을 가져옴
            .from('icecarebucket')
            .getPublicUrl(filePath); // 공개 URL 가져오기
        if(data.publicUrl){
            props.file_url = data.publicUrl;
            props.file_name = fileName;
            isModify?await modifyProfile(props):await insertProfile(props);
        }

    }
}

export const modifyProfile = async(props) =>{
    console.log("modify");
    console.log(props);
}

export const insertProfile = async(props) =>{
    console.log("insert");
    console.log(props);

    let pw = await bcrypt.hash(props.pw,10);

    let res = await supabase.from("member").insert([
        {
            id:props.id,
            pw,
            nm:props.nm,
            auth:props.auth,
            mail:props.mail,
            entr_date:props.entr_date.format("YYYY-MM-DD"),
            tel:props.tel,
            addr:props.addr,
            account_num:props.account_num,
            bank:props.bank?props.bank:null,
            type:props.type,
            file_nm:props.file_nm?props.file_nm:null,
            file_url:props.file_url?props.file_url:null,
        }
        ]);
    console.log(res);
    if(res.error){
        notification.error({message:"에러발생:"+res.error});
    }else{
        notification.success({message:"등록 성공"});
    }
    return res;

}