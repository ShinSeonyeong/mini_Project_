import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "../pages/Home.jsx";
import Status from "../pages/Status.jsx";
import Sales from "../pages/Sales.jsx";
import Reservation from "../pages/Reservation.jsx";
import Contact_us from "../pages/Contact_us.jsx";


function Body(props) {
    return (
        <>
                <Routes>
                    <Route path="/" element={<Home/>} />
                    <Route path="/status" element={<Status/>} />
                    <Route path="/sales" element={<Sales/>} />
                    <Route path="/reservation" element={<Reservation/>} />
                    <Route path="/contact" element={<Contact_us/>} />
                </Routes>
        </>
    );
}

export default Body;