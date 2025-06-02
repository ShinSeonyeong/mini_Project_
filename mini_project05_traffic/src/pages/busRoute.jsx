import React, { useEffect, useState } from "react";
import { Button, Card, Input, List, message, Space, Tag } from "antd";
import axios from "axios";
import proj4 from "proj4";

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
  const [selectedRoute, setSelectedRoute] = useState(null);
  // 상태 추가: 선택된 경로 인덱스 관리
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem("searchHistory");
    return saved ? JSON.parse(saved) : [];
  });

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
    if (!selectedOrigin) {
      message.warning({
        content: "출발 정류장을 선택해주세요.",
        key,
        duration: 2,
      });
      return;
    }
    if (!selectedDestination) {
      message.warning({
        content: "도착 정류장을 선택해주세요.",
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

      console.log("Selected Route:", body);
      console.log("Origin:", selectedOrigin);
      console.log("Destination:", selectedDestination);

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
    setOrigin(""); // 출발지 입력값 초기화
    setDestination(""); // 도착지 입력값 초기화
    setSelectedOrigin(null); // 선택된 출발지 객체 초기화
    setSelectedDestination(null); // 선택된 도착지 객체 초기화
    setRouteList([]); // 추천 경로 목록 초기화
    setSelectedRouteIndex(null); // 선택된 경로 초기화
    handleStartNewSearch(); // 검색결과 초기화
    // 부모 컴포넌트에 마커 제거, props 업데이트
    props.setOpenFind(false);
    props.setOriginRoute(null);
    props.setDestyRoute(null);
  };

  const convertNGISToKakao = (x, y) => {
    const [longitude, latitude] = proj4("EPSG:5182", "EPSG:4326", [x, y]);
    let lat = latitude;
    let lng = longitude;
    return { lat, lng };
  };

  const searchBusRoute = (value, target, dir) => {
    if (!value || value.trim() === "") return Promise.resolve(null);

    return axios
      .get(
        `https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${value}&wincId=`
      )
      .then((response) => {
        if (response.data.header.success && response.data.body.length > 0) {
          console.log("?", response.data.body);

          const firstStop = response.data.body[0];
          let data = response.data.body.map((el) => {
            let { lat, lng } = convertNGISToKakao(el.ngisXPos, el.ngisYPos);
            el.lat = lat;
            el.lng = lng;
            el.dir = dir;
            return el;
          });
          setSearchResults(data);
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

  // 검색 기록 클릭 시 해당 경로 재검색
  const handleHistoryClick = async (item) => {
    if (item.origin === item.destination) {
      message.error({
        content: "출발지와 도착지는 동일할 수 없습니다.",
        key: `history_error_${Date.now()}`,
        duration: 2,
      });
      return;
    }

    // 출발지 검색
    const originStop = await searchBusRoute(item.origin, "origin");
    if (originStop) {
      setSearchTarget("destination");
      // 도착지 검색
      const destinationStop = await searchBusRoute(
        item.destination,
        "destination"
      );
      if (destinationStop) {
        // 출발지와 도착지가 모두 설정된 경우 부모 컴포넌트에 경로 정보 전달
        props.setOpenFind(true);
        props.setOriginRoute(originStop);
        props.setDestyRoute(destinationStop);
        message.info({
          content: `${item.origin} → ${item.destination} 선택이 완료되었어요! [경로찾기]를 눌러 이동 경로를 확인해보세요.`,
          key,
          duration: 4,
        });
        setSearchResults([]);
      }
    }
  };

  const handleRouteSegmentClick = async (step) => {
    console.log("경로 구간 클릭:", step.stBsNm, "->", step.edBsNm);

    try {
      const [originStop, destinationStop] = await Promise.all([
        searchBusRoute(step.stBsNm, "origin"),
        searchBusRoute(step.edBsNm, "destination"),
      ]);

      if (originStop) {
        setOrigin(originStop.bsNm);
        setSelectedOrigin(originStop);
        props.setOriginRoute(originStop);
      }

      if (destinationStop) {
        setDestination(destinationStop.bsNm);
        setSelectedDestination(destinationStop);
        props.setDestyRoute(destinationStop);
      }
    } catch (error) {
      console.error("정류장 검색 실패:", error);
    }
  };

  // const handleRouteSegmentClick = (step) => {
  //   if (props.linkData?.target !== event.target)
  //     props.setLinkData(event.target);
  //   console.log("경로 구간 클릭:", step.stBsNm, "->", step.edBsNm);
  //   console.log("step : ", step);
  //   // 출발 정류장 정보 설정
  //   searchBusRoute(step.stBsNm, "origin").then((originStop) => {
  //     if (originStop) {
  //       props.setOpenFind(true);
  //       setOrigin(originStop.bsNm);
  //       setSelectedOrigin(originStop);
  //       props.setOriginRoute(originStop); // 부모 컴포넌트로 출발지 정보 전달
  //     }
  //   });

  //   // 도착 정류장 정보 설정
  //   searchBusRoute(step.edBsNm, "destination").then((destinationStop) => {
  //     if (destinationStop) {
  //       props.setOpenFind(true);
  //       setDestination(destinationStop.bsNm);
  //       setSelectedDestination(destinationStop);
  //       props.setDestyRoute(destinationStop); // 부모 컴포넌트로 도착지 정보 전달
  //     }
  //   });
  // };

  // const handleRouteSegmentClick = async (step) => {
  //   console.log("경로 구간 클릭:", step.stBsNm, "->", step.edBsNm);
  //   console.log("step : ", step);

  //   try {
  //     // 출발지와 도착지를 순차적으로 검색
  //     const originStop = await searchBusRoute(step.stBsNm, "origin");
  //     const destinationStop = await searchBusRoute(step.edBsNm, "destination");

  //     if (originStop) {
  //       setOrigin(originStop.bsNm);
  //       setSelectedOrigin(originStop);
  //       props.setOriginRoute(originStop);
  //     }
  //     if (destinationStop) {
  //       setDestination(destinationStop.bsNm);
  //       setSelectedDestination(destinationStop);
  //       props.setDestyRoute(destinationStop);
  //     }
  //     if (originStop && destinationStop) {
  //       props.setOpenFind(true);
  //       // 모든 데이터가 준비된 후 handleRouteClick 호출
  //       props.handleRouteClick({ list: [step] });
  //     } else {
  //       message.error({
  //         content: "출발지 또는 도착지 정보를 가져오지 못했습니다.",
  //         key: `search_error_${Date.now()}`,
  //         duration: 2,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("정류장 검색 실패:", error);
  //     message.error({
  //       content: "정류장 정보를 검색하는 중 오류가 발생했습니다.",
  //       key: `search_error_${Date.now()}`,
  //       duration: 2,
  //     });
  //   }
  // };

  // 지하철 포함된 경로 안 나오도록 필터링
  const filteredRouteList = routeList.filter(
    (route) =>
      !route.list.some((step) => step.routeNo.includes("지하철")) &&
      route.trans !== "환승"
  );

  return (
    <div>
      <div style={{ padding: "20px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Search
            id="originInput"
            placeholder="출발지를 선택해 주세요."
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setSearchTarget("origin");
            }}
            onSearch={(value) => {
              setSearchTarget("origin");
              searchBusRoute(value, setOrigin, 0);
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
            }}
            onSearch={(value) => {
              setSearchTarget("destination");
              searchBusRoute(value, setDestination, 1);
            }}
            allowClear
          />
        </Space>
      </div>

      <div style={{ padding: "20px" }}>
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

      <div style={{ padding: "20px" }}>
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

      {!isRouteSearched && searchResults.length > 0 && (
        <div style={{ padding: "20px" }}>
          <List
            variant="borderless"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  /* const latlng = convertNGISToKakao(
                                      item.ngisXPos,
                                      item.ngisYPos
                                    ); */
                  /* fetchArrivalInfo(item.bsId);
                                    setSelectedStop(item); */
                  if (searchTarget === "origin") {
                    setOrigin(item.bsNm); // 출발지 이름 설정
                    setSelectedOrigin(item); // 출발지 전체 객체 저장

                    console.log("선택된 시작 아이템 : ", item);
                    console.log(
                      "선택된 시작 아이템 위치: ",
                      item.lat,
                      item.lng
                    );
                    props.setOpenFind(true);
                    props.setOriginRoute(item);
                  } else if (searchTarget === "destination") {
                    setDestination(item.bsNm);
                    setSelectedDestination(item);

                    console.log("선택된 도착 아이템 : ", item);
                    props.setOpenFind(true);
                    props.setDestyRoute(item);
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
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    backgroundColor:
                      selectedRouteIndex === idx ? "#e6f7ff" : "transparent", // 선택된 경로 하이라이트
                    border:
                      selectedRouteIndex === idx ? "2px solid #1890ff" : "none",
                    borderRadius: 4,
                    padding: selectedRouteIndex === idx ? "8px" : "0",
                  }}
                  onClick={() => {
                    console.log(route);
                    setSelectedRouteIndex(idx);
                    props.handleRouteClick(route); // 지도에 경로와 마커를 렌더링
                  }}
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
                    {/* <Tag color={route.transCd === "T" ? "blue" : "green"}>
                      {route.trans}
                    </Tag> */}
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
                        onClick={() => {
                          handleRouteSegmentClick(step);
                          console.log("step", step);
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            marginBottom: 4,
                          }}
                        >
                          🚌 {step.routeNo} ({step.routeType})
                        </div>
                        {/* 특정 노선(step.routeNo)과 해당 노선의 출발 정류장(step.stBsNm) 및 도착 정류장(step.edBsNm) 정보 */}
                        <div
                          style={{
                            width: "100%",
                            padding: "5px 0",
                          }} // 클릭 영역 확보 및 시각적 피드백
                        >
                          출발: {step.stBsNm} → 도착: {step.edBsNm}
                        </div>
                        <div style={{ fontSize: 13, color: "#666" }}>
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
    </div>
  );
}

export default BusRoute;
