import { useState } from 'react'
import './App.css'
import Side from "./layout/Side.jsx";
import Body from "./layout/Body.jsx";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function App() {

  return (
    <>
      <Side/>
        <main className="login">
            <nav>
                <section>
                <AccountCircleIcon style={{fontSize:'50px'}} />
                </section>
            </nav>
            <div>
        <Body/>
            </div>
        </main>
    </>
  )
}

export default App
