import React, {useState} from 'react';
import {NavLink, useNavigate} from "react-router-dom";
import sideMenu from '../js/sideMenu.js';
import { AutoComplete } from 'antd';

function Side(props) {
    const [isReserved, setIsReserved] = useState(true);
    const [isNotice, setIsNotice] = useState(true);
    const [isStatus, setIsStatus] = useState(true);
    const [isEdit, setIsEdit] = useState(true);
    const [isFavorite, setIsFavorite] = useState(true);
    // const [currentSide, setCurrentSide] = useState('dashboard');
    const sideNav = useNavigate();

    const autocompleteSelect = (value,option)=>{
        const side_nav = {
            "isReserved":()=>setIsReserved(!isReserved),
            "isNotice":()=>setIsNotice(!isNotice),
            "isStatus":()=>setIsStatus(!isStatus),
            "isEdit":()=>setIsEdit(!isEdit),
            "isFavorite":()=>setIsFavorite(!isFavorite),
        }
        side_nav[option.state]();
        sideNav(option.link);
    }
    return (
        <>
            <aside className={'login'}>
                <div>
                    <NavLink to="/">
                        <img src="/src/images/side_logo.png" width={150} alt="Logo"/>
                    </NavLink>
                </div>
                <div>
                    <h1>관리자 센터</h1>
                </div>
                <div>
                    <h4>ID : </h4>
                    <span id={"id"}></span>
                    <h4>AUTH : </h4>
                    <span id={"pw"}></span>
                </div>
                <nav>
                    <h4>Dashboard</h4>
                    <div>
                        <div className={isStatus?"":"select"} onClick={() => {setIsStatus(!isStatus)}}>
                            <h3>대시보드</h3>
                        </div>
                    </div>
                    <h4>General</h4>
                    <AutoComplete
                        style={{ width: 150 }}
                        options={sideMenu}
                        onSelect={autocompleteSelect}
                        placeholder="메뉴검색"
                        filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                    />
                    <div>
                        <div className={isFavorite?"":"select"} onClick={() => setIsFavorite(!isFavorite)}>
                            <h3>즐겨찾기</h3>
                            <img className={isFavorite?"":"rotate"} src="/src/images/polygon.png" alt="" width={10} height={10}/>
                        </div>
                        <ul className={isFavorite ? "none" : ""}>

                        </ul>
                    </div>
                    <div>
                        <div className={isReserved?"":"select"} onClick={() => {setIsReserved(!isReserved)}}>
                            <h3>예약관리</h3>
                            <img className={`${isReserved?"":"rotate"}`} src="/src/images/polygon.png" alt="" width={10} height={10}/>
                        </div>
                        <ul className={`${isReserved ? 'none' : ''}`}>
                            <li>예약 등록</li>
                            <li>예약 수정</li>
                            <li>예약 조회</li>
                        </ul>
                    </div>
                    <div>
                        <div className={isNotice?"":"select"} onClick={() => {setIsNotice(!isNotice)}}>
                            <h3>게시판</h3>
                            <img className={isNotice?"":"rotate"} src="/src/images/polygon.png" alt="" width={10} height={10}/>
                        </div>
                        <ul className={`${isNotice ? 'none' : ''}`}>
                            <li>게시글 등록</li>
                            <li>게시글 수정</li>
                            <li>게시글 조회</li>
                        </ul>
                    </div>

                    <div>
                        <div className={isEdit?"":"select"} onClick={() => {setIsEdit(!isEdit)}}>
                            <h3>환경설정</h3>
                            <img  className={isEdit?"":"rotate"} src="/src/images/polygon.png" alt="" width={10} height={10}/>
                        </div>
                        <ul className={`${isEdit ? 'none' : ''}`}>
                            <li>메뉴관리</li>
                            <li>사원관리</li>
                        </ul>
                    </div>
                </nav>
            </aside>
        </>
    );
}

export default Side;