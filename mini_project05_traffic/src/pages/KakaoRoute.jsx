import React, { useEffect } from "react";

let map;
let markers = [];

function KakaoRoute({ departure, destination }) {
  const initMap = () => {
    const container = document.getElementById("map");
    const options = {
      center: new kakao.maps.LatLng(35.8714, 128.6014),
      level: 5,
    };
    map = new kakao.maps.Map(container, options);
  };

  const addMarker = (position, title) => {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position.lat, position.lng),
      map: map,
      title: title,
    });
    markers.push(marker);
  };

  const clearMarkers = () => {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
  };

  const moveCenter = (position) => {
    const latlng = new kakao.maps.LatLng(position.lat, position.lng);
    map.setCenter(latlng);
  };

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    if (departure || destination) {
      clearMarkers();

      if (departure) {
        addMarker(departure, "출발지");
      }

      if (destination) {
        addMarker(destination, "도착지");
      }

      if (departure && destination) {
        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(new kakao.maps.LatLng(departure.lat, departure.lng));
        bounds.extend(new kakao.maps.LatLng(destination.lat, destination.lng));
        map.setBounds(bounds);
      } else if (departure) {
        moveCenter(departure);
      } else if (destination) {
        moveCenter(destination);
      }
    }
  }, [departure, destination]);

  return <div id="map" style={{ width: "100%", height: "400px" }}></div>;
}

export default KakaoRoute;
