import {useEffect, useState} from 'react'
import './App.css'
import Side from "./layout/Side.jsx";
import Body from "./layout/Body.jsx";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {MenuUnfoldOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";

function App() {
    const [toggleAside, setToggleAside] = useState(true);
    const [login, setLogin] = useState("");
    let navigator = useNavigate();

    function isValidJson(item){
        try{
            JSON.parse(item);
            return true;
        }catch(e){
            return false;
        }
    }

    useEffect(() => {
        window.scrollTo({top: 0, left: 0});

        if (localStorage.getItem("log") && isValidJson(localStorage.getItem("log"))) {
            setLogin(JSON.parse(localStorage.getItem("log")));
        }else if(sessionStorage.getItem("log") && isValidJson(sessionStorage.getItem("log"))) {
            setLogin(JSON.parse(sessionStorage.getItem("log")));
        }
        else if (!login) navigator("/login");

    }, [location.pathname]);

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setLogin("");
        navigator("/login");
    }
    return (
        <>
            {login ?
                <>
                    <Side toggleAside={toggleAside} setToggleAside={setToggleAside} login={login}/>
                    <main className="login">
                        <nav>
                            <section>
                                <MenuUnfoldOutlined style={{fontSize: '32px'}} onClick={() => {
                                    setToggleAside(!toggleAside)
                                }}/>
                                <AccountCircleIcon style={{fontSize: '50px'}} onClick={logout}/>
                            </section>
                        </nav>
                        <div>
                            <Body setLogin={setLogin}/>
                        </div>
                    </main>
                </> : <div>
                    <Body setLogin={setLogin}/>
                </div>}

        </>
    )
}

export default App
