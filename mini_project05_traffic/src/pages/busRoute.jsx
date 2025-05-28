// busRoute.jsx
import React, { useEffect, useState } from "react";
import { Button, Card, Input, List, message, Space, Tag } from "antd";
import axios from "axios";
import proj4 from "proj4";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";

// EPSG:5182 (TM-동부원점) 좌표계 정의
proj4.defs(
  "EPSG:5182",
  "+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs"
);
// EPSG:4326 (WGS84) 좌표계 정의 (proj4에 이미 정의되어 있을 수 있지만, 명시적으로 추가)
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

function BusRoute(props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [arrivalInfo, setArrivalInfo] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 35.8693, lng: 128.6062 });
  const [selectedStop, setSelectedStop] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [routeList, setRouteList] = useState([]);
  const [isRouteSearched, setIsRouteSearched] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null); // 선택된 경로 (지도에 그릴 경로)
  const [detailedPolylinePath, setDetailedPolylinePath] = useState([]); // 상세 경로 좌표 저장 상태
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  }); // localStorage로 관리

  // Kakao 지도 로더 (API 키는 .env 파일에서 가져옵니다)
  useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_API_KEY,
    libraries: ["clusterer", "drawing", "services"],
  });

  // antd 메시지 알림 한번만 나오도록 key 설정
  const key = "unique_noti_key";

  // 출발지 또는 도착지 선택 시 지도 중심 이동
  useEffect(() => {
    if (selectedOrigin && selectedOrigin.ngisXPos && selectedOrigin.ngisYPos) {
      const { lat, lng } = convertNGISToKakao(
        selectedOrigin.ngisXPos,
        selectedOrigin.ngisYPos
      );
      setMapCenter({ lat, lng });
    } else if (
      selectedDestination &&
      selectedDestination.ngisXPos &&
      selectedDestination.ngisYPos
    ) {
      const { lat, lng } = convertNGISToKakao(
        selectedDestination.ngisXPos,
        selectedDestination.ngisYPos
      );
      setMapCenter({ lat, lng });
    }
  }, [selectedOrigin, selectedDestination]);

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevDestination = destination;
    const prevSelectedOrigin = selectedOrigin;
    const prevSelectedDestination = selectedDestination;

    setOrigin(prevDestination);
    setDestination(prevOrigin);
    setSelectedOrigin(prevSelectedDestination);
    setSelectedDestination(prevSelectedOrigin);

    // 경로 초기화
    setRouteList([]);
    setSelectedRoute(null);
    setIsRouteSearched(false);
  };

  const handleSearch = async () => {
    if (!selectedOrigin && !selectedDestination) {
      message.warning({
        content: "출발 정류장과 도착 정류장을 선택해주세요.",
        key,
        duration: 2,
      });
      return;
    }
    if (!selectedOrigin || !selectedDestination) {
      const msg = !selectedOrigin
        ? "출발 정류장을 선택해주세요."
        : "도착 정류장을 선택해주세요.";
      message.warning({
        content: msg,
        key,
        duration: 2,
      });
      return;
    }

    if (selectedOrigin.bsId === selectedDestination.bsId) {
      message.error({
        content: "출발지와 도착지는 동일할 수 없습니다.",
        key: `search_error_${Date.now()}`,
        duration: 2,
      });
      return;
    }

    const newEntry = {
      origin: selectedOrigin.bsNm,
      destination: selectedDestination.bsNm,
      originData: selectedOrigin,
      destinationData: selectedDestination,
    };

    // 중복 검색 방지
    const isDuplicate = searchHistory.some(
      (entry) =>
        entry.originData?.bsId === newEntry.originData.bsId &&
        entry.destinationData?.bsId === newEntry.destinationData.bsId
    );

    if (!isDuplicate) {
      const updated = [newEntry, ...searchHistory.slice(0, 4)];
      setSearchHistory(updated);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
    }

    // 출발지 및 도착지 좌표와 ID 추출
    const {
      ngisXPos: srcXPos,
      ngisYPos: srcYPos,
      bsId: srcBsID,
    } = selectedOrigin;
    const {
      ngisXPos: dstXPos,
      ngisYPos: dstYPos,
      bsId: dstBsID,
    } = selectedDestination;

    message.loading({
      content: "이동 경로를 확인하는 중입니다. 조금만 기다려 주세요.",
      key,
      duration: 2,
    });

    try {
      const response = await axios.get(
        "https://businfo.daegu.go.kr:8095/dbms_web_api/srcdstroute_new",
        {
          params: {
            srcXPos,
            srcYPos,
            dstXPos,
            dstYPos,
            srcBsID,
            dstBsID,
          },
        }
      );

      const { header, body } = response.data;

      if (header?.success && Array.isArray(body) && body.length > 0) {
        setRouteList(body);
        message.success({
          content: "경로 검색을 완료했습니다.",
          key,
          duration: 2,
        });
      } else {
        message.error({
          content: "요청하신 경로를 찾지 못했습니다.",
          key,
          duration: 2,
        });
        setRouteList([]);
        setSelectedRoute(null); // 경로 없으면 선택 경로 초기화
      }
    } catch (error) {
      console.error("경로 검색 실패:", error);
      message.error({
        content: "경로를 검색하는 중 문제가 발생했습니다.",
        key,
        duration: 2,
      });
      setRouteList([]);
      setSelectedRoute(null);
    }

    setIsRouteSearched(true);
  };

  const handleDeleteHistory = (index) => {
    setIsDeleting(true);
    const updated = [...searchHistory];
    updated.splice(index, 1);
    setSearchHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
    setIsDeleting(false);
  };

  const fetchArrivalInfo = (bsId) => {
    axios
      .get(`https://businfo.daegu.go.kr:8095/dbms_web_api/realtime/arr/${bsId}`)
      .then((response) => {
        if (response.data.header.success) {
          setArrivalInfo(response.data.body);
        } else {
          setArrivalInfo(null); // 도착 정보가 없을 때!
        }
      })
      .catch((error) => {
        console.error("도착 정보 조회 실패:", error);
        setArrivalInfo(null);
      });
  };

  const handleStartNewSearch = () => {
    setSearchResults([]);
    setIsRouteSearched(false);
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setRouteList([]);
    setSelectedRoute(null); // 선택된 경로 초기화
    handleStartNewSearch();
    setMapCenter({ lat: 35.8693, lng: 128.6062 }); // 지도 중심 초기화
  };

  // NGIS 좌표를 카카오 맵(WGS84) 좌표로 변환
  const convertNGISToKakao = (x, y) => {
    const [longitude, latitude] = proj4("EPSG:5182", "EPSG:4326", [x, y]);
    return { lat: latitude, lng: longitude };
  };

  const searchBusRoute = async (value, target) => {
    if (!value || value.trim() === "") {
      if (target === "origin") setSelectedOrigin(null);
      else if (target === "destination") setSelectedDestination(null);
      setSearchResults([]);
      return null;
    }

    try {
      const response = await axios.get(
        `https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${value}&wincId=`
      );

      if (response.data.header.success && response.data.body.length > 0) {
        setSearchResults(response.data.body);
        setArrivalInfo(null);
        setIsRouteSearched(false);

        const firstStop = response.data.body[0];
        setSelectedStop(firstStop); // 현재 선택된 정류장 (도착 정보 조회용)
        setMapCenter(
          convertNGISToKakao(firstStop.ngisXPos, firstStop.ngisYPos)
        );
        fetchArrivalInfo(firstStop.bsId);

        if (target === "origin") {
          setOrigin(firstStop.bsNm);
          setSelectedOrigin(firstStop);
        } else if (target === "destination") {
          setDestination(firstStop.bsNm);
          setSelectedDestination(firstStop);
        }
        return firstStop;
      } else {
        message.info({
          content: "검색 결과가 없습니다.",
          key: `no_result_${target}`,
          duration: 2,
        });
        setSearchResults([]);
        if (target === "origin") setSelectedOrigin(null);
        else if (target === "destination") setSelectedDestination(null);
        return null;
      }
    } catch (error) {
      console.error("정류장 검색에 실패했습니다:", error);
      message.error({
        content: "정류장을 검색하는 중 문제가 발생했습니다.",
        key: `search_fail_${target}`,
        duration: 2,
      });
      setSearchResults([]);
      if (target === "origin") setSelectedOrigin(null);
      else if (target === "destination") setSelectedDestination(null);
      return null;
    }
  };

  const handleHistoryClick = async (item) => {
    // searchHistory에서 저장된 상세 데이터를 사용
    const originStopData = item.originData;
    const destinationStopData = item.destinationData;

    if (!originStopData || !destinationStopData) {
      message.error({
        content: "저장된 정류장 정보가 올바르지 않습니다.",
        key: `history_error_data_${Date.now()}`,
        duration: 2,
      });
      return;
    }

    if (item.origin === item.destination) {
      message.error({
        content: "출발지와 도착지는 동일할 수 없습니다.",
        key: `history_error_${Date.now()}`,
        duration: 2,
      });
      return;
    }

    setOrigin(originStopData.bsNm);
    setSelectedOrigin(originStopData);
    setDestination(destinationStopData.bsNm);
    setSelectedDestination(destinationStopData);

    message.info({
      content: `${item.origin} → ${item.destination} 선택이 완료되었어요! [경로찾기]를 눌러 이동 경로를 확인해보세요.`,
      key,
      duration: 4,
    });

    setSearchResults([]); // 이전 검색 결과 리스트 숨김
    setIsRouteSearched(false); // 경로 검색 결과 숨김
    setRouteList([]); // 기존 경로 결과도 숨김
    setSelectedRoute(null); // 선택된 경로 초기화
  };

  // 지하철 포함된 경로 안 나오도록 필터링
  const filteredRouteList = routeList.filter(
    (route) => !route.list.some((step) => step.routeNo.includes("지하철"))
  );

  // 선택된 경로에 대한 Polyline 좌표 생성
  const getPolylinePath = () => {
    if (!selectedRoute || !selectedRoute.list) return [];
    let path = [];
    selectedRoute.list.forEach((step) => {
      // 각 단계의 시작점과 끝점을 추가. 단, 중간 경유지 좌표는 해당 API에서 제공되지 않으므로,
      // 시작점과 끝점을 이어서 선을 그립니다.
      // 더 정확한 경로를 그리려면 경로 선 정보 API를 호출해야 합니다.
      if (step.stXPos && step.stYPos) {
        path.push(convertNGISToKakao(step.stXPos, step.stYPos));
      }
      if (step.edXPos && step.edYPos) {
        path.push(convertNGISToKakao(step.edXPos, step.edYPos));
      }
    });
    // 중복 좌표 제거 (시작점과 끝점이 겹칠 경우 대비)
    return path.filter(
      (coord, index, self) =>
        index ===
        self.findIndex((c) => c.lat === coord.lat && c.lng === coord.lng)
    );
  };

  return (
    <div className="bus-route-container">
      <div className="search-section">
        <Space direction="vertical" className="search-inputs">
          <Input.Search
            id="originInput"
            placeholder="출발지를 선택해 주세요."
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setSearchTarget("origin");
              if (e.target.value === "") {
                setSelectedOrigin(null);
                setSearchResults([]);
              }
            }}
            onSearch={(value) => {
              setSearchTarget("origin");
              searchBusRoute(value, "origin");
            }}
            allowClear
            className="search-input"
          />

          <Input.Search
            id="destinationInput"
            placeholder="도착지를 선택해 주세요."
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setSearchTarget("destination");
              if (e.target.value === "") {
                setSelectedDestination(null);
                setSearchResults([]);
              }
            }}
            onSearch={(value) => {
              setSearchTarget("destination");
              searchBusRoute(value, "destination");
            }}
            allowClear
            className="search-input"
          />
        </Space>
      </div>

      <div className="button-section">
        <Space>
          <Button onClick={handleSwap} className="swap-button">
            🔄 출발지 ↔ 도착지
          </Button>
          <Button
            type="primary"
            onClick={handleSearch}
            className="search-button"
          >
            경로찾기
          </Button>
          <Button danger onClick={handleReset} className="reset-button">
            초기화
          </Button>
        </Space>
      </div>

      <div className="history-section">
        <Card title="최근 검색 경로" size="small" className="history-card">
          <List
            dataSource={searchHistory}
            renderItem={(item, index) => (
              <List.Item
                key={index}
                className="history-item"
                onClick={() => handleHistoryClick(item)} // 수정된 handleHistoryClick 사용
              >
                <span>
                  📍 {item.origin} → {item.destination}
                </span>
                <div
                  className="history-delete"
                  onClick={(e) => e.stopPropagation()} // 별도 div로 이벤트 차단
                >
                  <Button
                    type="text"
                    danger
                    onClick={() => handleDeleteHistory(index)} // 삭제만 처리
                  >
                    삭제
                  </Button>
                </div>
              </List.Item>
            )}
          ></List>
        </Card>
      </div>

      <Card className="info-card">
        <p>
          <strong>출발지:</strong>{" "}
          {selectedOrigin?.bsNm || <span className="no-selection">없음</span>}
        </p>
        <p>
          <strong>도착지:</strong>{" "}
          {selectedDestination?.bsNm || (
            <span className="no-selection">없음</span>
          )}
        </p>
      </Card>

      {/* 카카오 맵 영역 */}
      <div className="map-section">
        <Map
          center={mapCenter}
          style={{
            width: "100%",
            height: "350px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
          level={5} // 지도 확대 레벨 (값이 작을수록 확대)
        >
          {selectedOrigin && (
            <MapMarker // 출발지 마커
              position={convertNGISToKakao(
                selectedOrigin.ngisXPos,
                selectedOrigin.ngisYPos
              )}
              image={{
                src: "/stop_marker.png",
                size: { width: 24, height: 35 },
                options: { offset: { x: 12, y: 35 } },
              }}
              title={selectedOrigin.bsNm}
            />
          )}

          {selectedDestination && (
            <MapMarker // 도착지 마커
              position={convertNGISToKakao(
                selectedDestination.ngisXPos,
                selectedDestination.ngisYPos
              )}
              image={{
                src: "/stop_marker.png",
                size: { width: 24, height: 35 },
                options: { offset: { x: 12, y: 35 } },
              }}
              title={selectedDestination.bsNm}
            />
          )}

          {selectedRoute && ( // 선택된 경로가 있을 경우 폴리라인 표시
            <Polyline
              path={getPolylinePath()}
              strokeWeight={5} // 선의 두께
              strokeColor={"#FF0000"} // 선 색상 (빨간색)
              strokeOpacity={0.7} // 선 불투명도
              strokeStyle={"solid"} // 선 스타일
            />
          )}
        </Map>
      </div>

      {/* 출발/도착지 각각 검색 후 경로 검색하면 관련 검색어 닫기 */}
      {!isRouteSearched && searchResults.length > 0 && (
        <div className="search-results-section">
          <List
            variant="borderless"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  const latlng = convertNGISToKakao(
                    item.ngisXPos,
                    item.ngisYPos
                  );
                  fetchArrivalInfo(item.bsId);
                  setSelectedStop(item);
                  setMapCenter(latlng);

                  if (searchTarget === "origin") {
                    setOrigin(item.bsNm);
                    setSelectedOrigin(item);
                  } else if (searchTarget === "destination") {
                    setDestination(item.bsNm);
                    setSelectedDestination(item);
                  }
                  setSearchResults([]);
                }}
                className="search-result-item"
              >
                <div className="search-result-content">
                  <div className="stop-name">{item.bsNm}</div>
                  <div className="stop-id">정류장ID: {item.bsId}</div>
                  <div className="route-list">경유노선: {item.routeList}</div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {Array.isArray(routeList) && routeList.length > 0 && (
        <div className="route-section">
          <Card title="추천 경로" variant="outlined" className="route-card">
            <List
              dataSource={filteredRouteList}
              renderItem={(route, idx) => (
                <List.Item
                  key={idx}
                  className="route-item"
                  onClick={() => setSelectedRoute(route)} // 경로 클릭 시 지도에 해당 경로를 표시
                >
                  <div className="route-header">
                    <strong>{idx + 1}번 경로</strong>
                    <Tag color={route.transCd === "T" ? "blue" : "green"}>
                      {route.trans}
                    </Tag>
                  </div>
                  <div className="route-info">
                    총 소요 시간: <strong>{route.totalTime}</strong> / 총 거리:{" "}
                    <strong>{route.totalDist}</strong>
                  </div>
                  <List
                    dataSource={route.list}
                    renderItem={(step, sIdx) => (
                      <List.Item
                        key={sIdx}
                        className={`route-step ${
                          sIdx % 2 === 0 ? "even" : "odd"
                        }`}
                      >
                        <div className="step-details">
                          <div className="step-title">
                            🚌 {step.routeNo} ({step.routeType})
                          </div>
                          <div className="step-route">
                            출발: {step.stBsNm} → 도착: {step.edBsNm}
                          </div>
                          <div className="step-info">
                            소요 시간: {step.time} / 거리: {step.dist} / 정류장
                            수: {step.gap}
                          </div>
                        </div>
                      </List.Item>
                    )}
                    pagination={false}
                  />
                </List.Item>
              )}
              pagination={false}
            />
          </Card>
        </div>
      )}

      <style>{`
        /* 전체 컨테이너 */
        .bus-route-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          box-sizing: border-box;
          font-family: 'Noto Sans KR', sans-serif;
        }

        /* 검색 입력 영역 */
        .search-section {
          padding: 1rem;
        }

        .search-inputs {
          width: 100%;
          gap: 1rem;
        }

        .search-input {
          width: 100% !important;
          border-radius: 8px;
        }

        /* 버튼 영역 */
        .button-section {
          padding: 1rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .swap-button, .search-button, .reset-button {
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }

        /* 최근 검색 경로 */
        .history-section {
          padding: 1rem;
        }

        .history-card {
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .history-item {
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-item:hover {
          background-color: #f5f5f5;
        }

        .history-delete {
          margin-left: 0.5rem;
        }

        /* 출발지/도착지 정보 */
        .info-card {
          margin: 1rem;
          border-radius: 12px;
          background: #fafafa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .no-selection {
          color: red;
        }

        /* 검색 결과 */
        .search-results-section {
          padding: 1rem;
        }

        .search-result-item {
          cursor: pointer;
          padding: 0.75rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .search-result-item:hover {
          background-color: #f5f5f5;
        }

        .search-result-content {
          width: 100%;
        }

        .stop-name {
          font-weight: bold;
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }

        .stop-id {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .route-list {
          color: #1890ff;
          font-size: 0.9rem;
        }

        /* 추천 경로 */
        .route-section {
          padding: 1rem;
        }

        .route-card {
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .route-item {
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .route-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .route-info {
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 0.5rem;
        }

        .route-step {
          padding-left: 1rem;
          border-left: 2px solid #1890ff;
          margin-bottom: 0.5rem;
          border-radius: 4px;
          width: 100%;
        }

        .route-step.even {
          background-color: #f0f5ff;
        }

        .route-step.odd {
          background-color: #ffffff;
        }

        .step-details {
          width: 100%;
        }

        .step-title {
          font-weight: bold;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .step-route {
          font-size: 0.9rem;
          color: #444;
        }

        .step-info {
          font-size: 0.85rem;
          color: #666;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .bus-route-container {
            padding: 0.5rem;
          }

          .search-section, .button-section, .history-section, .search-results-section, .route-section {
            padding: 0.5rem;
          }

          .search-input {
            font-size: 0.9rem;
          }

          .swap-button, .search-button, .reset-button {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .history-card, .info-card, .route-card {
            margin: 0.5rem;
          }

          .stop-name, .step-title {
            font-size: 1rem;
          }

          .stop-id, .route-list, .step-route, .step-info {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .search-inputs {
            gap: 0.5rem;
          }

          .button-section {
            flex-direction: column;
            align-items: center;
          }

          .swap-button, .search-button, .reset-button {
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .history-item, .search-result-item, .route-item {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default BusRoute;
