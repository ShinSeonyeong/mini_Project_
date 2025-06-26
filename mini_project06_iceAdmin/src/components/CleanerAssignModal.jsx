import React, { useState, useEffect } from "react";
import { Modal, List, Card, Tag, Button, message, Tooltip } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getApprovedCleaners,
  checkCleanerAvailability,
} from "../js/supabaseEmpl";
import { supabase } from "../js/supabase";
import axios from "axios";

const API_URL = "https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app";
const API_URL2 =
  "https://port-0-cleaning-node-managdgo41797b84.sel4.cloudtype.app/subscribe/send";

const CleanerAssignModal = ({
  visible,
  onCancel,
  reservation,
  onAssign,
  onDataChange,
}) => {
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
      console.error("Error fetching cleaners:", error);
      message.error("기사 정보를 불러오는데 실패했습니다.");
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
        .from("reservation")
        .update({
          gisa_email: cleaner.id,
          state: 4, // 기사배정 상태
        })
        .eq("res_no", reservation.res_no);

      if (updateError) throw updateError;

      // customer 테이블에서 전화번호 가져오기
      const { data: customerData, error: customerError } = await supabase
        .from("customer")
        .select("phone")
        .eq("email", reservation.user_email)
        .single();

      if (customerError) {
        console.error("고객 정보 조회 실패:", customerError);
        throw customerError;
      }

      // 첫 번째 푸시 알림 전송
      try {
        // 전화번호가 없는 경우 처리
        if (!customerData?.phone) {
          console.error("전화번호가 없습니다.");
          throw new Error("전화번호가 없습니다.");
        }

        // 전화번호 그대로 사용 (하이픈 유지)
        const cleanPhone = customerData.phone;

        // alert("API 호출 전 데이터 확인");
        // alert(`전화번호: ${cleanPhone}`);
        // alert(`예약번호: ${reservation.res_no}`);
        // alert(`API 요청 URL: ${API_URL}/push/send/${cleanPhone}`);

        // form-urlencoded 형식으로 데이터 전송
        const formData = new URLSearchParams();
        formData.append("res_no", reservation.res_no);
        // alert(`전송할 데이터: ${formData.toString()}`);

        try {
          const response1 = await axios.post(
            `${API_URL}/push/send/${cleanPhone}`,
            formData,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          // alert("API 응답 확인");
          // alert(`응답 상태: ${response1.status}`);
          // alert(`응답 데이터: ${JSON.stringify(response1.data)}`);

          if (response1.data.message === "success") {
            console.log(
              "첫 번째 푸시 알림 전송 성공(기사배정, CleanerAssignModal.jsx)"
            );
          } else {
            console.log(
              "첫 번째 푸시 알림 전송 실패(기사배정, CleanerAssignModal.jsx)"
            );
          }
        } catch (apiError) {
          alert("API 호출 중 에러 발생");
          alert(`에러 메시지: ${apiError.message}`);
          if (apiError.response) {
            alert(`에러 상태: ${apiError.response.status}`);
            alert(`에러 데이터: ${JSON.stringify(apiError.response.data)}`);
          }
          throw apiError;
        }

        // 두 번째 푸시 알림 전송
        const formData2 = new URLSearchParams();
        formData2.append(
          "gisa_data",
          JSON.stringify({
            endpoint: cleaner.endpoint,
            p256dh: cleaner.p256dh,
            alarm_auth: cleaner.alarm_auth,
          })
        );
        formData2.append("phone", cleaner.tel);
        formData2.append(
          "res_data",
          JSON.stringify({
            res_no: reservation.res_no,
            date: reservation.date,
          })
        );

        // alert("두 번째 API 호출 전 데이터 확인");
        // alert(`기사 전화번호: ${cleaner.tel}`);
        // alert(`예약번호: ${reservation.res_no}`);
        // alert(`API 요청 URL: ${API_URL2}`);
        // alert(`전송할 데이터: ${formData2.toString()}`);

        try {
          const response2 = await axios.post(API_URL2, formData2, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          // alert("두 번째 API 응답 확인");
          // alert(`응답 상태: ${response2.status}`);
          // alert(`응답 데이터: ${JSON.stringify(response2.data)}`);

          if (response2.data.message === "success") {
            console.log(
              "두 번째 푸시 알림 전송 성공(기사배정, CleanerAssignModal.jsx)"
            );
          } else {
            console.log(
              "두 번째 푸시 알림 전송 실패(기사배정, CleanerAssignModal.jsx)"
            );
          }
        } catch (apiError) {
          alert("두 번째 API 호출 중 에러 발생");
          alert(`에러 메시지: ${apiError.message}`);
          if (apiError.response) {
            alert(`에러 상태: ${apiError.response.status}`);
            alert(`에러 데이터: ${JSON.stringify(apiError.response.data)}`);
          }
          throw apiError;
        }
      } catch (pushError) {
        console.error("푸시 알림 전송 중 에러:", pushError);
      }

      message.success("기사가 배정되었습니다.");
      onAssign();
      onCancel();
      onDataChange();
    } catch (error) {
      console.error("Error assigning cleaner:", error);
      message.error("기사 배정에 실패했습니다.");
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
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
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
              style={{ width: "100%" }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleAssign(cleaner)}
                  disabled={!cleanerAvailability[cleaner.id]}
                >
                  배정하기
                </Button>,
              ]}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <UserOutlined /> {cleaner.nm}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {cleaner.tel}
                  </div>
                </div>
                <Tooltip
                  title={
                    cleanerAvailability[cleaner.id]
                      ? "해당 시간에 배정 가능한 기사입니다."
                      : "해당 시간에 다른 예약이 있어 배정이 불가능합니다."
                  }
                >
                  <Tag
                    color={
                      cleanerAvailability[cleaner.id] ? "success" : "error"
                    }
                  >
                    {cleanerAvailability[cleaner.id]
                      ? "배정 가능"
                      : "배정 불가"}
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
