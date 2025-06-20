import React, { useState, useEffect } from "react";
import { Modal, List, Card, Tag, Button, message, Tooltip } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { getApprovedCleaners, checkCleanerAvailability } from "../js/supabaseEmpl";
import { supabase } from "../js/supabase";

const CleanerAssignModal = ({ visible, onCancel, reservation, onAssign, onDataChange }) => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [cleanerAvailability, setCleanerAvailability] = useState({});

  useEffect(() => {
    if (visible && reservation) {
      fetchCleaners();
    }
  }, [visible, reservation]);

  const fetchCleaners = async () => {
    if (!reservation) return;
    
    try {
      setLoading(true);
      const cleanerData = await getApprovedCleaners();
      setCleaners(cleanerData);
      
      // 각 기사의 가용성 체크
      const availabilityMap = {};
      for (const cleaner of cleanerData) {
        const isAvailable = await checkCleanerAvailability(
          cleaner.id,
          reservation.date,
          reservation.time
        );
        availabilityMap[cleaner.id] = isAvailable;
      }
      setCleanerAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      message.error('기사 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (cleaner) => {
    if (!reservation || !cleaner) return;

    try {
      setLoading(true);

      // 기사 배정 상태로 업데이트
      const { error: updateError } = await supabase
        .from('reservation')
        .update({
          gisa_email: cleaner.id,
          state: 4 // 기사배정 상태
        })
        .eq('res_no', reservation.res_no);

      if (updateError) throw updateError;

      message.success('기사가 배정되었습니다.');
      onAssign();
      onCancel();
      onDataChange();
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      message.error('기사 배정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="기사 배정"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <CalendarOutlined /> 예약일: {reservation?.date}
            </div>
            <div>
              <ClockCircleOutlined /> 시간: {reservation?.time}
            </div>
          </div>
        </Card>
      </div>

      <List
        loading={loading}
        dataSource={cleaners}
        renderItem={(cleaner) => (
          <List.Item>
            <Card
              size="small"
              style={{ width: '100%' }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleAssign(cleaner)}
                  disabled={!cleanerAvailability[cleaner.id]}
                >
                  배정하기
                </Button>
              ]}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <UserOutlined /> {cleaner.nm}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {cleaner.tel}
                  </div>
                </div>
                <Tooltip title={cleanerAvailability[cleaner.id] ? 
                  "해당 시간에 배정 가능한 기사입니다." : 
                  "해당 시간에 다른 예약이 있어 배정이 불가능합니다."}>
                  <Tag color={cleanerAvailability[cleaner.id] ? "success" : "error"}>
                    {cleanerAvailability[cleaner.id] ? "배정 가능" : "배정 불가"}
                  </Tag>
                </Tooltip>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default CleanerAssignModal; 