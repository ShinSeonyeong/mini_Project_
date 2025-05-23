import React, {useState} from 'react';
import {Button, Card, Input, List, message, Space} from "antd";
import axios from "axios";
import proj4 from "proj4";

function BusRoute(props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [arrivalInfo, setArrivalInfo] = useState(null);
  const [mapCenter, setMapCenter] = useState({lat: 35.8693, lng: 128.6062});
  const [selectedStop, setSelectedStop] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);



  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  }

  const handleSearch = () => {
    if (!origin) {
      message.warning('출발지를 선택해주세요.');
      document.getElementById('originInput')?.focus();
      return;
    }
    if (!destination) {
      message.warning('도착지를 선택해주세요.');
      document.getElementById('destinationInput')?.focus();
      return;
    }
    message.success('경로를 찾는 중....');


    axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/route/searchPath?startBsId=${selectedOrigin.bsId}&endBsId=${selectedDestination.bsId}`)


  }

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

    const handleReset = () => {
      setOrigin('');
      setDestination('');
    }

    const convertNGISToKakao = (x, y) => {
      const [longitude, latitude] = proj4("EPSG:5182", "EPSG:4326", [x, y]);
      let lat = latitude;
      let lng = longitude;
      return {lat, lng};
    }

    const searchBusRoute = (value, setValue) => {
      axios.get(`https://businfo.daegu.go.kr:8095/dbms_web_api/bs/search?searchText=${value}&wincId=`)
          .then(response => {
            if (response.data.header.success) {
              setValue(value);
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
            console.log("정류장 검색 실패했습니다:", error);
          });
    };

    return (
        <div>
          <div style={{padding: "20px"}}>
            <Space direction="vertical" style={{width: '100%'}}>
              <Input.Search id="originInput"
                            placeholder="출발지를 선택하세요."
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                            onSearch={(value) => {
                              setSearchTarget('origin');
                              searchBusRoute(value, setOrigin);
                            }}
                            allowClear
              />
              <Input.Search id="destinationInput"
                            placeholder="도착지를 선택하세요."
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            onSearch={(value) => {
                              setSearchTarget('destination');
                              searchBusRoute(value, setDestination);
                            }}
                            allowClear
              />
            </Space>
          </div>

          <div style={{padding: '20px'}}>
            <Space>
              <Button onClick={handleSwap}>🔄 출발지 ↔ 도착지</Button>
              <Button type="primary" onClick={handleSearch}>경로찾기</Button>
              <Button danger onClick={handleReset}>초기화</Button>
            </Space>
          </div>

          <div style={{padding: '20px'}}>
            <List
                bordered
                dataSource={searchResults}
                renderItem={(item) => (
                    <List.Item
                        onClick={() => {
                          fetchArrivalInfo(item.bsId);
                          setSelectedStop(item);
                          setMapCenter(convertNGISToKakao(item.ngisXPos, item.ngisYPos));

                          if (searchTarget === 'origin') {
                            setOrigin(item.bsNm);
                          } else if (searchTarget === 'destination') {
                            setDestination(item.bsNm);
                          }
                        }}
                        style={{cursor: 'pointer'}}
                    >
                      <div style={{width: "100%"}}>
                        <div style={{fontWeight: "bold", fontSize: "1.1em", marginBottom: "4px"}}>
                          {item.bsNm}
                        </div>
                        <div style={{color: "#666", fontSize: "0.9em", marginBottom: "4px"}}>
                          정류장ID: {item.bsId}
                        </div>
                        <div style={{color: "#1890ff", fontSize: "0.9em"}}>
                          경유노선: {item.routeList}
                        </div>
                      </div>
                    </List.Item>
                )}
            />
          </div>
        </div>
    );
  }

  export default BusRoute;