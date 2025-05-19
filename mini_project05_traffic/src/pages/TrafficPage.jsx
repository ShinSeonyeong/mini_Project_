import React, { useState, useEffect } from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { Input, List, Typography, Card } from "antd";
import axios from "axios";

import proj4 from 'proj4';

// EPSG:5182 (TM-동부원점) 좌표계 정의
proj4.defs("EPSG:5182", "+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");

// EPSG:4326 (WGS84) 좌표계 정의
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

const { Search } = Input;
const { Title } = Typography;

const TrafficPage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [arrivalInfo, setArrivalInfo] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 35.8693, lng: 128.6062 });
    const [selectedStop, setSelectedStop] = useState(null);
    const [nearbyStops, setNearbyStops] = useState([]);
    const [map, setMap] = useState(null);
    const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
    const [busStops, setBusStops] = useState([]);

    useKakaoLoader({
        appkey: import.meta.env.VITE_KAKAO_API_KEY,
        libraries: ["clusterer", "services", "drawing"],
    });

    // useEffect(() => {
    //     // 대구 정류소 전체 조회 해오기
    //     const fetchBusStops = async () => {
    //         try {
    //             const response = await axios.get('https://apis.data.go.kr/6270000/dbmsapi01/getBasic', {
    //                 params: {
    //                     serviceKey: '6j4MG9vFqOJ24QdvW+Q1R5lChK83ym4k0UFBww6Kv/GKEmRsYrtwq/TnVYqpWX640SMT+QXrEdOTn2zFEzdC0g=='
    //                 }
    //             });
    //
    //             if (response.data.header.success) {
    //                 console.log(response.data.body.items.bs);
    //                 setBusStops(response.data.body.items.bs);
    //             }
    //         } catch (error) {
    //             console.error("버스 정류장 데이터 조회 실패:", error);
    //         }
    //     };
    //
    //     fetchBusStops();
    // }, []);

    const fetchArrivalInfo = (bsId) => {
        axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/realtime/arr/${bsId}`)
            .then(response => {
                if (response.data.header.success) {
                    setArrivalInfo(response.data.body);
                }
            })
            .catch(error => {
                console.error("도착 정보 조회 실패:", error);
            });
    };

    const fetchNearbyStops = (lat, lng) => {
        if (currentZoomLevel <= 3) {
            // axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/bs/nearby?xPos=${lng}&yPos=${lat}&radius=1000`)
            //     .then(response => {
            //         if (response.data.header.success) {
            //             setNearbyStops(response.data.body);
            //             console.log(response.data.body);
            //         }
            //     })
            //     .catch(error => {
            //         console.error("주변 정류장 조회 실패:", error);
            //     });
        } else {
            setNearbyStops([]);
        }
    };

    const onMapCenterChanged = (map) => {
        const center = map.getCenter();
        fetchNearbyStops(center.getLat(), center.getLng());
    };

    const onZoomChanged = (map) => {
        const level = map.getLevel();
        setCurrentZoomLevel(level);
        const center = map.getCenter();
        fetchNearbyStops(center.getLat(), center.getLng());
    };

    const convertNGISToKakao = (x, y) => {
        const [longitude, latitude] = proj4("EPSG:5182", "EPSG:4326", [x, y]);
        let lat = latitude;
        let lng = longitude;
        return { lat, lng };
    };

    return (
        <div style={{ width: "100%", height: "100vh", display: "flex" }}>
            <Map
                center={mapCenter}
                level={3}
                style={{ width: "70%", height: "100%" }}
                onCenterChanged={(map) => onMapCenterChanged(map)}
                onZoomChanged={(map) => onZoomChanged(map)}
                onLoad={setMap}
            >
                {selectedStop && (
                    <MapMarker
                        position={convertNGISToKakao(selectedStop.ngisXPos, selectedStop.ngisYPos)}
                    />
                )}
                {currentZoomLevel <= 3 && busStops.map((stop) => (
                    <MapMarker
                        key={stop.bsId}
                        position={{
                            lat: parseFloat(stop.yPos),
                            lng: parseFloat(stop.xPos)
                        }}
                        onClick={() => {
                            setSelectedStop(stop);
                            fetchArrivalInfo(stop.bsId);
                        }}
                    >
                        <div style={{ padding: "5px", color: "#000" }}>
                            {stop.bsNm}
                        </div>
                    </MapMarker>
                ))}
            </Map>
            <div style={{ width: "30%", height: "100%", overflowY: "auto" }}>
                <div style={{ padding: "1rem" }}>
                    <h3>대구 버스 정류장 검색</h3>
                    <div style={{ marginBottom: "1rem" }}>
                        <Input.Search
                            placeholder="정류장 검색"
                            enterButton="검색"
                            size="large"
                            onSearch={(value) => {
                                axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${value}&wincId=`)
                                    .then(response => {
                                        if (response.data.header.success) {
                                            setSearchResults(response.data.body);
                                            setArrivalInfo(null);
                                            if (response.data.body.length > 0) {
                                                const firstStop = response.data.body[0];
                                                setSelectedStop(firstStop);
                                                setMapCenter(convertNGISToKakao(firstStop.ngisXPos, firstStop.ngisYPos));
                                                fetchArrivalInfo(firstStop.bsId);
                                            }
                                        }
                                    })
                                    .catch(error => {
                                        console.error("정류장 검색 실패:", error);
                                    });
                            }}
                        />
                    </div>
                    <div>
                        <List
                            bordered
                            dataSource={searchResults}
                            renderItem={(item) => (
                                <List.Item
                                    onClick={() => {
                                        fetchArrivalInfo(item.bsId);
                                        setSelectedStop(item);
                                        setMapCenter(convertNGISToKakao(item.ngisXPos, item.ngisYPos));
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ width: "100%" }}>
                                        <div style={{
                                            fontWeight: "bold",
                                            fontSize: "1.1em",
                                            marginBottom: "4px"
                                        }}>
                                            {item.bsNm}
                                        </div>
                                        <div style={{
                                            color: "#666",
                                            fontSize: "0.9em",
                                            marginBottom: "4px"
                                        }}>
                                            정류장 ID: {item.bsId}
                                        </div>
                                        <div style={{
                                            color: "#1890ff",
                                            fontSize: "0.9em"
                                        }}>
                                            경유 노선: {item.routeList}
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                    {selectedStop && (
                        <Card
                            title={`${selectedStop.bsNm} 실시간 도착 정보`}
                            style={{ marginTop: "1rem" }}
                        >
                            {arrivalInfo ? (
                                <List
                                    dataSource={arrivalInfo.list}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <div style={{ width: "100%" }}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "4px"
                                                }}>
                                                    <div style={{
                                                        fontWeight: "bold",
                                                        fontSize: "1.1em"
                                                    }}>
                                                        {item.routeNo} {item.routeNote && `(${item.routeNote})`}
                                                    </div>
                                                    <div style={{
                                                        color: item.arrState === "전" ? "#52c41a" :
                                                            item.arrState === "전전" ? "#faad14" : "#1890ff",
                                                        fontWeight: "bold"
                                                    }}>
                                                        {item.arrState === "전" ? "곧 도착" :
                                                            item.arrState === "전전" ? "곧 도착 예정" :
                                                                `${item.arrState} 후 도착`}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    color: "#666",
                                                    fontSize: "0.9em"
                                                }}>
                                                    버스 번호: {item.vhcNo2}
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <div>도착 정보를 불러오는 중...</div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
export default TrafficPage;