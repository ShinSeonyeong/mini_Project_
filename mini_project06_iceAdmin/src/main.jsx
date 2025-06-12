import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom";
import { unstableSetRender } from 'antd';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { registerSW } from 'virtual:pwa-register'
registerSW()

unstableSetRender((node, container) => {
    container._reactRoot ||= createRoot(container);
    const root = container._reactRoot;
    root.render(node);
    return async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        root.unmount();
    };
});

createRoot(document.getElementById('root')).render(
    <ConfigProvider locale={koKR}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ConfigProvider>
)
