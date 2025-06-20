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
    return res.data;
}

export const getEmplWithNextReservation = async(type,nm)=>{
    try {
        // 1. 먼저 기사 목록을 가져옵니다
        let memberQuery = supabase
            .from("member")
            .select('*')
            .eq('auth', 2) // 기사 권한만 선택
            .order('entr_date', { ascending: false }); // 입사일자 기준 내림차순 정렬

        if(type){
            memberQuery = memberQuery.eq("type",type);
        }
        if(nm){
            memberQuery = memberQuery.ilike("nm","%"+nm+"%");
        }

        const { data: members, error: memberError } = await memberQuery;

        if (memberError) throw memberError;

        // 2. 각 기사별로 가장 가까운 예약을 찾습니다
        const today = new Date().toISOString().split('T')[0];
        const results = [];

        for (const member of members) {
            const { data: reservations, error: resError } = await supabase
                .from("reservation")
                .select('date, time, addr')
                .eq('gisa_email', member.mail)  // member의 mail 컬럼과 reservation의 gisa_email 매칭
                .gte('date', today)
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(1);

            if (resError) {
                console.error('Reservation fetch error:', resError);
                continue;
            }

            results.push({
                ...member,
                next_reservation: reservations && reservations.length > 0 ? reservations[0] : null
            });
        }

        return results;
    } catch (error) {
        notification.error({message:"에러발생:"+error.message});
        return [];
    }
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
    // 수정 로직 구현 예정
}

export const insertProfile = async(props) =>{
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
    if(res.error){
        notification.error({message:"에러발생:"+res.error});
    }else{
        notification.success({message:"등록 성공"});
    }
    return res;
}

export const updateEmployeeApproval = async (employeeId, isApproved) => {
    try {
        const { data, error } = await supabase
            .from("member")
            .update({ indentify: isApproved }) // true: 승인, false: 미승인
            .eq('id', employeeId)
            .select();

        if (error) {
            notification.error({
                message: "승인 상태 변경 실패",
                description: error.message
            });
            throw error;
        }

        notification.success({
            message: isApproved ? "승인 완료" : "승인 취소",
            description: `기사님의 승인 상태가 ${isApproved ? '승인' : '미승인'}으로 변경되었습니다.`
        });

        return data[0];
    } catch (error) {
        console.error('승인 상태 변경 중 오류 발생:', error);
        throw error;
    }
}

export const getApprovedCleaners = async () => {
    try {
        const { data, error } = await supabase
            .from("member")
            .select("*")
            .eq('auth', 2)  // 기사 권한
            .eq('indentify', true)  // 승인된 기사만
            .order('nm');  // 이름순 정렬

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('승인된 기사 목록 조회 실패:', error);
        return [];
    }
};

export const checkCleanerAvailability = async (cleanerId, date, time) => {
    try {
        // 해당 날짜에 기사의 예약 목록 조회
        const { data: reservations, error } = await supabase
            .from("reservation")
            .select("time")
            .eq('gisa_email', cleanerId)
            .eq('date', date)
            .in('state', [4, 5]); // 기사 배정 상태(4)와 청소 완료 상태(5)만 체크

        if (error) throw error;

        // 예약이 없으면 가능
        if (!reservations || reservations.length === 0) {
            return true;
        }

        // 시간대 중복 체크
        const timeSlots = {
            "10:00": 1,
            "12:00": 2,
            "14:00": 3,
            "16:00": 4
        };

        const requestedTimeSlot = timeSlots[time];
        const existingTimeSlots = reservations.map(r => timeSlots[r.time]);

        // 시간대가 겹치는지 확인
        // 시간대 간 2시간 이상 차이나면 배정 가능
        return !existingTimeSlots.some(slot => Math.abs(slot - requestedTimeSlot) < 2);

    } catch (error) {
        console.error('기사 가용성 체크 실패:', error);
        return false;
    }
};