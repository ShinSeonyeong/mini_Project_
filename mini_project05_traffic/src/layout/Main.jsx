import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import KaokaoMain from "../pages/KaokaoMain.jsx";
import My from "../pages/My.jsx";
import TrafficPage from "../pages/TrafficPage.jsx";

function Main(props) {
    return (
        <>
                <Routes>
                    <Route path="/" element={<KaokaoMain />} />
                    <Route path="/my" element={<My/>} />
                    <Route path="/trafficPage" element={<TrafficPage/>} />
                </Routes>
        </>
    );
}

export default Main;