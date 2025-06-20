import { supabase } from './supabase';

// 팝업 테이블 생성 확인
const checkPopupTable = async () => {
    const { data, error } = await supabase
        .from('popups')
        .select('id')
        .limit(1);
    
    if (error) {
        if (error.code === '42P01') { // 테이블이 존재하지 않는 경우
            // 테이블 생성
            const { error: createError } = await supabase.rpc('create_popups_table');
            if (createError) {
                console.error('팝업 테이블 생성 실패:', createError);
                throw createError;
            }
        } else {
            throw error;
        }
    }
};

// 팝업 목록 조회
export const getPopups = async () => {
    try {
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('팝업 목록 조회 에러:', error);
            throw error;
        }
        return data || [];
    } catch (error) {
        console.error('팝업 목록 조회 실패:', error);
        throw error;
    }
};

// 현재 노출 중인 팝업 조회
export const getActivePopups = async () => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .eq('display_status', 'show')
            .lte('start_date', now)
            .gte('end_date', now)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('활성 팝업 조회 에러:', error);
            throw error;
        }
        
        // 필드명 매핑
        return (data || []).map(popup => ({
            ...popup,
            displayType: popup.display_type,
            displayStatus: popup.display_status,
            imageUrl: popup.image_url,
            mobileImageUrl: popup.mobile_image_url,
            linkUrl: popup.link_url,
            closeOption: popup.close_option
        }));
    } catch (error) {
        console.error('활성 팝업 조회 실패:', error);
        throw error;
    }
};

// 팝업 추가
export const addPopup = async (popupData) => {
    try {
        // display_type이 null이면 기본값 'popup' 사용
        const dataToInsert = {
            ...popupData,
            display_type: popupData.display_type || 'popup',
            display_status: popupData.display_status || 'show',
            display_environment: popupData.display_environment || ['desktop', 'mobile'],
            close_option: popupData.close_option || ['today'],
            position_x: popupData.position_x || '50%',
            position_y: popupData.position_y || '50%',
            width: popupData.width || '400px',
            height: popupData.height || 'auto'
        };

        const { data, error } = await supabase
            .from('popups')
            .insert([dataToInsert])
            .select();
        
        if (error) {
            console.error('팝업 추가 에러:', error);
            throw error;
        }
        return data[0];
    } catch (error) {
        console.error('팝업 추가 실패:', error);
        throw error;
    }
};

// 팝업 수정
export const updatePopup = async (id, popupData) => {
    try {
        const { data, error } = await supabase
            .from('popups')
            .update({
                title: popupData.title,
                display_type: popupData.displayType,
                display_status: popupData.displayStatus,
                start_date: popupData.startDate,
                end_date: popupData.endDate,
                display_environment: popupData.displayEnvironment,
                image_url: popupData.imageUrl,
                mobile_image_url: popupData.mobileImageUrl,
                link_url: popupData.linkUrl,
                close_option: popupData.closeOption,
                position_x: popupData.positionX,
                position_y: popupData.positionY,
                width: popupData.width,
                height: popupData.height
            })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error('팝업 수정 에러:', error);
            throw error;
        }
        return data[0];
    } catch (error) {
        console.error('팝업 수정 실패:', error);
        throw error;
    }
};

// 팝업 삭제
export const deletePopup = async (id) => {
    try {
        const { error } = await supabase
            .from('popups')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('팝업 삭제 에러:', error);
            throw error;
        }
    } catch (error) {
        console.error('팝업 삭제 실패:', error);
        throw error;
    }
}; 