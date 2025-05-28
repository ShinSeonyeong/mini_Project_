// busRoute.jsx
import React, { useEffect, useState } from "react";
import { Button, Card, Input, List, message, Space, Tag } from "antd";
import axios from "axios";
import proj4 from "proj4";
import { Map, MapMarker, Polyline, useKakaoLoader } from "react-kakao-maps-sdk";
import KaokaoMain from "./KaokaoMain";

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
  const [routeResults, setRouteResults] = useState([]);
  const [selectedRoute, setSeletedRoute] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  }); // localStorage로 관리

    // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 카카오맵 SDK 로드 (모바일에서만 로드)
  const { loading, error } = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_API_KEY,
    libraries: ["services"],
    skip: !isMobile, // 모바일이 아닌 경우 로드 스킵
  });

  // 로딩 및 에러 처리
  useEffect(() => {
    if (error && isMobile) {
      message.error({
        content: "카카오맵을 로드하지 못했습니다. 네트워크를 확인하세요.",
        key: "map_error",
        duration: 3,
      });
    }
  }, [error, isMobile]);

  // antd 메시지 알림 한번만 나오도록 key 설정
  const key = "unique_noti_key";

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevDestination = destination;
    const prevSelectedOrigin = selectedOrigin;
    const prevSelectedDestination = selectedDestination;

    setOrigin(prevDestination);
    setDestination(prevOrigin);
    setSelectedOrigin(prevSelectedDestination);
    setSelectedDestination(prevSelectedOrigin);
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
    const newEntry = { origin, destination };
    // 중복 검색 방지
    const isDuplicate = searchHistory.some(
      (entry) => entry.origin === origin && entry.destination === destination
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
      } else {
        message.error({
          content: "요청하신 경로를 찾지 못했습니다.",
          key,
          duration: 2,
        });
        setRouteList([]);
      }
    } catch (error) {
      console.error("경로 검색 실패:", error);
      message.error({
        content: "경로를 검색하는 중 문제가 발생했습니다.",
        key,
        duration: 2,
      });
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
        }
      })
      .catch((error) => {
        console.error("도착 정보 조회 실패:", error);
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
    handleStartNewSearch();
  };

  const convertNGISToKakao = (x, y) => {
    const [longitude, latitude] = proj4("EPSG:5182", "EPSG:4326", [x, y]);
    let lat = latitude;
    let lng = longitude;
    return { lat, lng };
  };

  const searchBusRoute = (value, target) => {
    if (!value || value.trim() === "") return Promise.resolve(null);

    return axios
      .get(
        `https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${value}&wincId=`
      )
      .then((response) => {
        if (response.data.header.success && response.data.body.length > 0) {
          const firstStop = response.data.body[0];
          // 출발/도착지 각각 검색할 떄 관련 결과 나오도록 해줌
          setSearchResults(response.data.body);
          setArrivalInfo(null);
          setIsRouteSearched(false);
          setSelectedStop(firstStop);
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
        }
        return null;
      })
      .catch((error) => {
        console.log("정류장 검색에 실패했습니다:", error);
      });
  };

  const handleHistoryClick = async (item) => {
    if (item.origin === item.destination) {
      message.error({
        content: "출발지와 도착지는 동일할 수 없습니다.",
        key: `history_error_${Date.now()}`,
        duration: 2,
      });
      return;
    }

    const originStop = await searchBusRoute(item.origin, "origin");
    if (originStop) {
      setSearchTarget("destination");
      const destinationStop = await searchBusRoute(
        item.destination,
        "destination"
      );
      if (destinationStop) {
        message.info({
          content: `${item.origin} → ${item.destination} 선택이 완료되었어요! [경로찾기]를 눌러 이동 경로를 확인해보세요.`,
          key,
          duration: 4,
        });
        setSearchResults([]);
      }
    }
  };

  // 지하철 포함된 경로 안 나오도록 필터링
  const filteredRouteList = routeList.filter(
    (route) => !route.list.some((step) => step.routeNo.includes("지하철"))
  );

  return (
    <div>
      <div className="search-section" style={{ padding: "20px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Search
            id="originInput"
            placeholder="출발지를 선택해 주세요."
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setSearchTarget("origin");
              if (e.target.value === "") setSelectedOrigin(null);
            }}
            onSearch={(value) => {
              setSearchTarget("origin");
              searchBusRoute(value, setOrigin);
            }}
            allowClear
          />

          <Input.Search
            id="destinationInput"
            placeholder="도착지를 선택해 주세요."
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              setSearchTarget("destination");
              if (e.target.value === "") setSelectedDestination(null);
            }}
            onSearch={(value) => {
              setSearchTarget("destination");
              searchBusRoute(value, setDestination);
            }}
            allowClear
          />
        </Space>
      </div>

      <div className="button-section" style={{ padding: "20px" }}>
        <Space>
          <Button onClick={handleSwap}>🔄 출발지 ↔ 도착지</Button>
          <Button type="primary" onClick={handleSearch}>
            경로찾기
          </Button>
          <Button danger onClick={handleReset}>
            초기화
          </Button>
        </Space>
      </div>

      <div className="history-section" style={{ padding: "20px" }}>
        <Card title="최근 검색 경로" size="small">
          <List
            dataSource={searchHistory}
            renderItem={(item, index) => (
              <List.Item
                key={index}
                style={{ cursor: "pointer" }}
                onClick={() => handleHistoryClick(item)} // 수정된 handleHistoryClick 사용
              >
                <span>
                  📍 {item.origin} → {item.destination}
                </span>
                <div
                  onClick={(e) => e.stopPropagation()} // 별도 div로 이벤트 차단
                  style={{ marginLeft: "10px" }}
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

      {isMobile && (
        <div className="map-section" style={{ padding: "20px" }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              지도를 로드 중입니다...
            </div>
          ) : (
            <Card
              title="지도"
              style={{
                height: mapExpanded ? "80vh" : "40vh",
                overflow: "hidden",
              }}
              className={mapExpanded ? "expanded" : ""}
            >
              <Map
                center={mapCenter}
                style={{ width: "100%", height: "100%" }}
                level={3}
              >
                {selectedOrigin && (
                  <MapMarker
                    position={convertNGISToKakao(
                      selectedOrigin.ngisXPos,
                      selectedOrigin.ngisYPos
                    )}
                    title="출발지"
                  />
                )}
                {selectedDestination && (
                  <MapMarker
                    position={convertNGISToKakao(
                      selectedDestination.ngisXPos,
                      selectedDestination.ngisYPos
                    )}
                    title="도착지"
                  />
                )}
                {isMobile && !loading && routeList.length > 0 && (
                  <Polyline
                    path={routeList[0].list.map((step) =>
                      convertNGISToKakao(step.ngisXPos, step.ngisYPos)
                    )}
                    strokeWeight={5}
                    strokeColor="#1890ff"
                    strokeOpacity={0.7}
                    strokeStyle="solid"
                  />
                )}
              </Map>
              <Button
                onClick={() => setMapExpanded(!mapExpanded)}
                style={{ position: "absolute", top: "10px", right: "10px" }}
              >
                {mapExpanded ? "지도 축소" : "지도 확대"}
              </Button>
            </Card>
          )}
        </div>
      )}

      <Card
        style={{ marginBottom: 16, borderRadius: 12, background: "#fafafa" }}
      >
        <p>
          <strong>출발지:</strong>{" "}
          {selectedOrigin?.bsNm || <span style={{ color: "red" }}>없음</span>}
        </p>
        <p>
          <strong>도착지:</strong>{" "}
          {selectedDestination?.bsNm || (
            <span style={{ color: "red" }}>없음</span>
          )}
        </p>
      </Card>

      {/* 출발/도착지 각각 검색 후 경로 검색하면 관련 검색어 닫기 */}
      {!isRouteSearched && searchResults.length > 0 && (
        <div style={{ padding: "20px" }}>
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

                  if (searchTarget === "origin") {
                    setOrigin(item.bsNm);
                    setSelectedOrigin(item);
                  } else if (searchTarget === "destination") {
                    setDestination(item.bsNm);
                    setSelectedDestination(item);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1em",
                      marginBottom: "4px",
                    }}
                  >
                    {item.bsNm}
                  </div>
                  <div
                    style={{
                      color: "#666",
                      fontSize: "0.9em",
                      marginBottom: "4px",
                    }}
                  >
                    정류장ID: {item.bsId}
                  </div>
                  <div style={{ color: "#1890ff", fontSize: "0.9em" }}>
                    경유노선: {item.routeList}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {Array.isArray(routeList) && routeList.length > 0 && (
        <div style={{ padding: "20px" }}>
          <Card title="추천 경로" variant="outlined">
            <List
              dataSource={filteredRouteList}
              renderItem={(route, idx) => (
                <List.Item
                  key={idx}
                  style={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <strong>{idx + 1}번 경로</strong>
                    <Tag color={route.transCd === "T" ? "blue" : "green"}>
                      {route.trans}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 8, fontSize: 14, color: "#555" }}>
                    총 소요 시간: <strong>{route.totalTime}</strong> / 총 거리:{" "}
                    <strong>{route.totalDist}</strong>
                  </div>
                  <List
                    dataSource={route.list}
                    renderItem={(step, sIdx) => (
                      <List.Item
                        key={sIdx}
                        className="route-item"
                        style={{
                          paddingLeft: 12,
                          borderLeft: "2px solid #1890ff",
                          marginBottom: 8,
                          flexDirection: "column",
                          alignItems: "flex-start",
                          backgroundColor: sIdx % 2 === 0 ? "#f0f5ff" : "white",
                          borderRadius: 4,
                          width: "100%",
                        }}
                      >
                        <div
                          className="step-title"
                          style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            marginBottom: 4,
                          }}
                        >
                          🚌 {step.routeNo} ({step.routeType})
                        </div>
                        <div
                          className="step-desc"
                          style={{ fontSize: 14, color: "#444" }}
                        >
                          출발: {step.stBsNm} → 도착: {step.edBsNm}
                        </div>
                        <div
                          className="step-desc"
                          style={{ fontSize: 13, color: "#666" }}
                        >
                          소요 시간: {step.time} / 거리: {step.dist} / 정류장
                          수: {step.gap}
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

      <style>
        {`
          @media (max-width: 768px) {
            .container {
              display: flex;
              flex-direction: column;
              padding: 8px;
            }
            .search-section,
            .button-section,
            .map-section,
            .history-section {
              padding: 8px !important;
            }
            .button-section .ant-space {
              flex-direction: column;
              gap: 12px;
              align-items: stretch;
            }
            .button-section .ant-btn {
              width: 100%;
              font-size: 14px;
              padding: 8px;
            }
            .map-section .ant-card {
              height: 40vh;
              transition: height 0.3s ease;
            }
            .map-section .ant-card.expanded {
              height: 80vh;
            }
            .route-item {
              padding-left: 8px !important;
              border-left: 2px solid #1890ff;
              margin-bottom: 8px !important;
              border-radius: 4px;
            }
            .route-item .step-title {
              font-size: 14px !important;
              margin-bottom: 4px;
            }
            .route-item .step-desc {
              font-size: 12px !important;
              line-height: 1.4;
            }
            .ant-list-item {
              padding: 8px 12px !important;
            }
            .ant-card {
              padding: 12px !important;
            }
          }

          @media (max-width: 480px) {
            .search-section .ant-input-search {
              font-size: 14px !important;
            }
            .button-section .ant-btn {
              font-size: 13px;
              padding: 6px;
            }
            .map-section .ant-card {
              height: 30vh;
            }
            .map-section .ant-card.expanded {
              height: 70vh;
            }
            .route-item .step-title {
              font-size: 13px !important;
            }
            .route-item .step-desc {
              font-size: 11px !important;
            }
            .ant-card-title {
              font-size: 16px !important;
            }
          }

          @media (min-width: 769px) {
            .container {
              display: flex;
              flex-direction: column; /* 데스크톱에서도 세로 정렬 */
              padding: 20px;
            }
            .search-section,
            .button-section,
            .history-section {
              padding: 20px !important;
            }
            .map-section {
              display: none !important; /* 데스크톱에서 지도 숨김 */
            }
          }
        `}
      </style>
    </div>
  );
}

export default BusRoute;
