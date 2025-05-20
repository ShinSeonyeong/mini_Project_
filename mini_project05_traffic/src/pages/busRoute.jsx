import React, { useState } from "react";
import { Button, Input, List, message, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import proj4 from "proj4";

// EPSG:5182 (TM-동부원점) 좌표계 정의
proj4.defs(
  "EPSG:5182",
  "+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs"
);

// EPSG:4326 (WGS84) 좌표계 정의
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

function BusRoute() {
  const [departureInput, setDepartureInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [departureResults, setDepartureResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const handleDepartSearch = async () => {
    if (!departureInput) {
      message.warning("출발지를 입력해주세요.");
      return;
    }

    const testResults = [
      { id: 1, name: "중앙로역" },
      { id: 2, name: "반월당역" },
    ];
    setDepartureResults(testResults);
  };

  const handleDestSearch = async () => {
    if (!destinationInput) {
      message.warning("도착지를 입력해주세요.");
      return;
    }
    const testResults = [
      { id: 1, name: "중앙로역" },
      { id: 2, name: "반월당역" },
    ];
    setDestinationResults(testResults);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" style={{ width: "100%", padding: "10px" }}>
        <Input.Search
          placeholder="출발지를 선택해주세요."
          value={departureInput}
          onChange={(e) => setDepartureInput(e.target.value)}
          onSearch={handleDepartSearch}
        />
      </Space>

      {departureResults.length > 0 && (
        <List
          header={<strong>출발지 검색결과</strong>}
          bordered
          dataSource={departureResults}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                setSelectedDeparture(item);
              }}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedDeparture?.id === item.id ? "#e6f7ff" : "white",
              }}
            >
              {item.name}
            </List.Item>
          )}
          style={{ marginBottom: "20px" }}
        />
      )}

      <Space direction="vertical" style={{ width: "100%", padding: "10px" }}>
        <Input.Search
          placeholder="도착지를 선택해주세요."
          value={destinationInput}
          onChange={(e) => setDestinationInput(e.target.value)}
          onSearch={handleDestSearch}
        />
      </Space>

      {destinationResults.length > 0 && (
        <List
          header={<strong>도착지 검색결과</strong>}
          bordered
          dataSource={destinationResults}
          renderItem={(item) => (
            <List.Item
              onClick={() => {
                setSelectedDestination(item);
              }}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedDestination?.id === item.id ? "#e6f7ff" : "white",
              }}
            >
              {item.name}
            </List.Item>
          )}
          style={{ marginBottom: "20px" }}
        />
      )}

      {selectedDeparture && (
        <div style={{ marginTop: "10px" }}>
          <strong>선택된 출발지: </strong> {selectedDeparture.name}
        </div>
      )}
      {selectedDestination && (
        <div style={{ marginTop: "10px" }}>
          <strong>선택된 도착지: </strong> {selectedDestination.name}
        </div>
      )}

      <div style={{ padding: "10px" }}>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          style={{ width: "100%" }}
        >
          경로 찾기
        </Button>
      </div>
    </div>
  );
}

export default BusRoute;
