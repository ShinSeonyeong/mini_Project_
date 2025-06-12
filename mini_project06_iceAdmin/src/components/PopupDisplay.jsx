import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { getActivePopups } from '../js/supabasePopup';
import styles from '../css/PopupDisplay.module.css';

const PopupDisplay = () => {
    const [popups, setPopups] = useState([]);
    const [visiblePopups, setVisiblePopups] = useState({});

    useEffect(() => {
        fetchPopups();
    }, []);

    const fetchPopups = async () => {
        try {
            const data = await getActivePopups();
            setPopups(data);
            
            // 로컬 스토리지에서 닫은 팝업 확인
            const closedPopups = JSON.parse(localStorage.getItem('closedPopups') || '{}');
            const today = new Date().toDateString();
            
            // 오늘 닫은 팝업만 필터링
            const todayClosedPopups = Object.entries(closedPopups)
                .filter(([_, date]) => date === today)
                .reduce((acc, [id]) => ({ ...acc, [id]: true }), {});
            
            setVisiblePopups(todayClosedPopups);
        } catch (error) {
            console.error('팝업 로드 실패:', error);
        }
    };

    const handleClose = (popup) => {
        if (popup.closeOption?.includes('today')) {
            const closedPopups = JSON.parse(localStorage.getItem('closedPopups') || '{}');
            closedPopups[popup.id] = new Date().toDateString();
            localStorage.setItem('closedPopups', JSON.stringify(closedPopups));
        }
        setVisiblePopups(prev => ({ ...prev, [popup.id]: true }));
    };

    return (
        <>
            {popups.map(popup => (
                !visiblePopups[popup.id] && (
                    <Modal
                        key={popup.id}
                        open={true}
                        footer={null}
                        closable={true}
                        onCancel={() => handleClose(popup)}
                        width={popup.width || (popup.displayType === 'banner' ? '100%' : '400px')}
                        className={styles.popupModal}
                        style={{
                            top: popup.displayType === 'banner' ? 0 : (popup.positionY || '50%'),
                            left: popup.displayType === 'banner' ? 0 : (popup.positionX || '50%'),
                            width: popup.width || undefined,
                            height: popup.height || undefined,
                            transform: popup.displayType === 'banner' ? 'none' : 'translate(-50%, -50%)',
                            position: 'fixed',
                            zIndex: 1300
                        }}
                    >
                        <a 
                            href={popup.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.popupLink}
                        >
                            <img 
                                src={popup.imageUrl} 
                                alt={popup.title}
                                className={styles.popupImage}
                            />
                        </a>
                    </Modal>
                )
            ))}
        </>
    );
};

export default PopupDisplay; 