import React, { useState, useEffect } from "react";
import { Modal, List, Card, Tag, Button, message, Tooltip } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { supabase } from "../js/supabase";

const CleanerAssignModal = ({ visible, onCancel, reservation, onAssign, onDataChange }) => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [cleanerSchedules, setCleanerSchedules] = useState({});

  useEffect(() => {
    if (visible && reservation) {
      fetchCleaners();
      // 기존에 배정된 기사가 있다면 선택
      if (reservation.gisa_email) {
        const existingCleaner = cleaners.find(c => c.id === reservation.gisa_email);
        if (existingCleaner) {
          setSelectedCleaner(existingCleaner);
        }
      }
    }
  }, [visible, reservation]);

  useEffect(() => {
    if (cleaners.length > 0 && reservation?.gisa_email) {
      const existingCleaner = cleaners.find(c => c.id === reservation.gisa_email);
      if (existingCleaner) {
        setSelectedCleaner(existingCleaner);
      }
    }
  }, [cleaners, reservation]);

  const fetchCleaners = async () => {
    if (!reservation) return;
    
    try {
      setLoading(true);
      const { data: memberData, error } = await supabase
        .from('member')
        .select('nm, id, tel')  // 기사이름, 이메일주소, 전화번호만 선택
        .eq('auth', 2);

      if (error) throw error;
      setCleaners(memberData);
      
      // 각 기사의 스케줄 확인
      await checkCleanerSchedules(memberData);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      message.error('기사 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkCleanerSchedules = async (cleanerList) => {
    if (!reservation) return;
    
    const schedules = {};
    
    for (const cleaner of cleanerList) {
      try {
        // member.id와 reservation.gisa_email이 외래키로 연결되어 있으므로
        // gisa_email로 조회하여 해당 기사의 스케줄을 가져옴
        const { data: scheduleData, error } = await supabase
          .from('reservation')
          .select('*')
          .eq('gisa_email', cleaner.id)  // cleaner.id는 member의 id(이메일)
          .eq('date', reservation.date)
          .eq('state', 4); // 기사배정 상태인 예약만

        if (error) throw error;
        schedules[cleaner.id] = scheduleData;
      } catch (error) {
        console.error(`Error fetching schedule for cleaner ${cleaner.id}:`, error);
        schedules[cleaner.id] = [];
      }
    }
    
    setCleanerSchedules(schedules);
  };

  const isTimeConflict = (cleanerId) => {
    const schedules = cleanerSchedules[cleanerId] || [];
    return schedules.some(schedule => {
      const scheduleTime = schedule.time;
      const newTime = reservation.time;
      
      // 시간 비교 (HH:MM 형식)
      const scheduleHour = parseInt(scheduleTime.split(':')[0]);
      const scheduleMinute = parseInt(scheduleTime.split(':')[1]);
      const newHour = parseInt(newTime.split(':')[0]);
      const newMinute = parseInt(newTime.split(':')[1]);
      
      // 2시간 간격으로 예약 가능하다고 가정
      const timeDiff = Math.abs((scheduleHour * 60 + scheduleMinute) - (newHour * 60 + newMinute));
      return timeDiff < 120; // 2시간 미만이면 충돌
    });
  };

  const handleAssign = async () => {
    if (!selectedCleaner) {
      message.warning('기사를 선택해주세요.');
      return;
    }

    if (isTimeConflict(selectedCleaner.id)) {
      message.error('선택한 기사의 스케줄과 시간이 겹칩니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reservation')
        .update({ 
          gisa_email: selectedCleaner.id,  // member의 id(이메일)를 저장
          state: 4
        })
        .eq('res_no', reservation.res_no);

      if (error) throw error;
      
      message.success('기사가 성공적으로 배정되었습니다.');
      onAssign();
      onDataChange();
      onCancel();
    } catch (error) {
      message.error('기사 배정 실패: ' + error.message);
    }
  };

  const renderCleanerCard = (cleaner) => {
    const hasConflict = isTimeConflict(cleaner.id);
    const schedules = cleanerSchedules[cleaner.id] || [];
    
    return (
      <Card
        key={cleaner.id}
        style={{
          marginBottom: 8,
          opacity: hasConflict ? 0.6 : 1,
          cursor: hasConflict ? 'not-allowed' : 'pointer',
          border: selectedCleaner?.id === cleaner.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
        }}
        onClick={() => !hasConflict && setSelectedCleaner(cleaner)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, color: hasConflict ? '#999' : '#000' }}>
              <UserOutlined /> {cleaner.nm}
            </h4>
            <p style={{ margin: '4px 0', color: hasConflict ? '#999' : '#666', fontSize: '12px' }}>
              📧 {cleaner.id}
            </p>
            <p style={{ margin: '4px 0', color: hasConflict ? '#999' : '#666', fontSize: '12px' }}>
              📞 {cleaner.tel}
            </p>
          </div>
          <div>
            {hasConflict ? (
              <Tag color="red">스케줄 충돌</Tag>
            ) : (
              <Tag color="green">배정 가능</Tag>
            )}
          </div>
        </div>
        
        {schedules.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
              <CalendarOutlined /> {reservation.date} 스케줄:
            </p>
            {schedules.map((schedule, index) => (
              <Tag key={index} color="orange" style={{ margin: '2px' }}>
                <ClockCircleOutlined /> {schedule.time}
              </Tag>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title="기사 배정"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          취소
        </Button>,
        <Button
          key="assign"
          type="primary"
          onClick={handleAssign}
          disabled={!selectedCleaner || isTimeConflict(selectedCleaner?.id)}
        >
          배정하기
        </Button>
      ]}
    >
      {reservation && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
          <h4 style={{ margin: 0 }}>예약 정보</h4>
          <p style={{ margin: '4px 0' }}>
            <CalendarOutlined /> 예약일: {reservation.date}
          </p>
          <p style={{ margin: '4px 0' }}>
            <ClockCircleOutlined /> 예약시간: {reservation.time}
          </p>
        </div>
      )}
      
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>기사 정보를 불러오는 중...</div>
        ) : (
          cleaners.map(renderCleanerCard)
        )}
      </div>
    </Modal>
  );
};

export default CleanerAssignModal; 