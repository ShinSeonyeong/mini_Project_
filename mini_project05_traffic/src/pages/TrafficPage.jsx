import React, {useState, useEffect, useCallback} from "react";
import {Map, MapMarker, useKakaoLoader} from "react-kakao-maps-sdk";
import {Input, List, Typography, Card} from "antd";
import axios from "axios";
import basicData from '../bs.json';
import { throttle } from 'lodash';

const TrafficPage = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [arrivalInfo, setArrivalInfo] = useState(null);
    const [mapCenter, setMapCenter] = useState({lat: 35.8693, lng: 128.6062});
    const [selectedStop, setSelectedStop] = useState(null);
    const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
    const [visibleStops, setVisibleStops] = useState([]);

    useKakaoLoader({
        appkey: import.meta.env.VITE_KAKAO_MAP_KEY,
        libraries: ["clusterer", "services", "drawing"],
    });

    const getVisibleStops = (map) => {
        const bounds = map.getBounds();
        const swLatLng = bounds.getSouthWest();
        const neLatLng = bounds.getNorthEast();

        const minLat = swLatLng.getLat();
        const maxLat = neLatLng.getLat();
        const minLng = swLatLng.getLng();
        const maxLng = neLatLng.getLng();

        const filteredStops = basicData.bs.filter(stop => {
            const lat = parseFloat(parseFloat(stop.yPos).toFixed(6));
            const lng = parseFloat(parseFloat(stop.xPos).toFixed(6));
            return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
        }).slice(0, 100);

        return filteredStops;
    };

    useEffect(() => {
        // 초기 로드 시 기본 영역의 정류장 표시
        const initialStops = basicData.bs.filter(stop => {
            const lat = parseFloat(parseFloat(stop.yPos).toFixed(6));
            const lng = parseFloat(parseFloat(stop.xPos).toFixed(6));
            // 대구시 중심 좌표 기준 ±0.1도 범위
            return lat >= 35.7693 && lat <= 35.9693 && lng >= 128.5062 && lng <= 128.7062;
        }).slice(0, 500);
        setVisibleStops(initialStops);
    }, [mapCenter]);

    const fetchArrivalInfo = useCallback(
        throttle((bsId) => {
            axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/realtime/arr/${bsId}`)
                .then(response => {
                    if (response.data.header.success) {
                        setArrivalInfo(response.data.body);
                    }
                })
                .catch(error => {
                    console.error("도착 정보 조회 실패:", error);
                });
        }, 2000),
        []
    );

    const onMapCenterChanged = useCallback(
        throttle((map) => {
            setVisibleStops(getVisibleStops(map));
        }, 500),
        []
    );

    const onZoomChanged = useCallback(
        throttle((map) => {
            const level = map.getLevel();
            setCurrentZoomLevel(level);
            if (level <= 4) {
                onMapCenterChanged(map);
            } else {
                setVisibleStops([]);
            }
        }, 500),
        []
    );

    return (
        <div style={{width: "100%", height: "100vh", display: "flex"}}>
            <Map
                center={mapCenter}
                level={3}
                style={{width: "70%", height: "100%"}}
                onCenterChanged={(map) => onMapCenterChanged(map)}
                onZoomChanged={(map) => onZoomChanged(map)}
            >
                {currentZoomLevel <= 4 && visibleStops.map((stop) => (
                    <MapMarker
                        key={stop.bsId}
                        position={{
                            lat: parseFloat(parseFloat(stop.yPos).toFixed(6)),
                            lng: parseFloat(parseFloat(stop.xPos).toFixed(6))
                        }}
                        onClick={() => {
                            setSelectedStop(stop);
                            fetchArrivalInfo(stop.bsId);
                        }}
                    >
                        <div style={{padding: "5px", color: "#000"}}>
                            {stop.bsNm}
                        </div>
                    </MapMarker>
                ))}
            </Map>
            <div style={{width: "30%", height: "100%", overflowY: "auto"}}>
                <div style={{padding: "1rem"}}>
                    <h3>대구 버스 정류장 검색</h3>
                    <div style={{marginBottom: "1rem"}}>
                        <Input.Search
                            placeholder="정류장 검색"
                            enterButton="검색"
                            size="large"
                            onSearch={async (value) => {
                                try {
                                    const { data } = await axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${encodeURIComponent(value)}&wincId`);
                                    console.log(data);
                                    if (data.header.success && data.body) {
                                        setSearchResults(data.body);
                                        setArrivalInfo(null);
                                    }
                                } catch (error) {
                                    console.error("Error fetching bus stops:", error);
                                }
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
                                        // basicData에서 일치하는 정류장 찾기
                                        console.time('find')
                                        const matchingStop = basicData.bs.find(stop => stop.bsId === item.bsId);
                                        console.log(parseFloat(parseFloat(matchingStop.yPos).toFixed(6)));
                                        console.log(parseFloat(parseFloat(matchingStop.xPos).toFixed(6)));
                                        console.timeEnd('find');
                                        if (matchingStop) {
                                            setSelectedStop(matchingStop);
                                            setMapCenter({
                                                lat: parseFloat(parseFloat(matchingStop.yPos).toFixed(6)),
                                                lng: parseFloat(parseFloat(matchingStop.xPos).toFixed(6))
                                            });
                                            fetchArrivalInfo(item.bsId);
                                        }
                                    }}
                                    style={{cursor: 'pointer'}}
                                >
                                    <div style={{width: "100%"}}>
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
                            style={{marginTop: "1rem"}}
                        >
                            {arrivalInfo ? (
                                <List
                                    dataSource={arrivalInfo.list}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <div style={{width: "100%"}}>
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