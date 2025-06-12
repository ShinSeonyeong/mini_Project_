import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "../pages/Home.jsx";
import Reservation from "../pages/Reservation.jsx";
import BoardManage from "../pages/BoardManage.jsx";
import Employee from "../pages/Employee.jsx";
import Login from "../pages/Login.jsx";
import PopupManage from "../pages/PopupManage.jsx";

function Body(props) {
    return (
        <>
                <Routes>
                    <Route path="/" element={<Home/>} />
                    <Route path="/login" element={<Login setLogin={props.setLogin} />}/>
                    <Route path="/reservation" element={<Reservation/>} />
                    <Route path="/contact" element={<BoardManage/>} />
                    <Route path="/employee" element={<Employee/>} />
                    <Route path="/popup" element={<PopupManage />} />
                </Routes>
        </>
    );
}

export default Body;