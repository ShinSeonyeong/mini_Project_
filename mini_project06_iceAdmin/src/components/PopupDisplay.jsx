import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { getActivePopups } from '../js/supabasePopup';
import styles from '../css/PopupDisplay.module.css';

const PopupDisplay = () => {
    const [popups, setPopups] = useState([]);
    const [visiblePopups, setVisiblePopups] = useState({});

    useEffect(() => {
        const isDesktop = window.innerWidth > 768;
        if (!isDesktop) {
            return; // 데스크탑이 아니면 팝업 로직을 실행하지 않음
        }

        const fetchPopups = async () => {
            try {
                const allPopups = await getActivePopups();
                // 'desktop' 환경을 가진 팝업만 필터링
                const desktopPopups = allPopups.filter(p => 
                    Array.isArray(p.display_environment) && p.display_environment.includes('desktop')
                );
                
                setPopups(desktopPopups);

                const closedPopups = JSON.parse(localStorage.getItem('closedPopups') || '{}');
                const today = new Date().toDateString();
                
                const initialVisibleState = {};
                desktopPopups.forEach(p => {
                    if (closedPopups[p.id] === today) {
                        initialVisibleState[p.id] = true;
                    }
                });
                setVisiblePopups(initialVisibleState);
            } catch (error) {
                console.error('팝업 로드 실패:', error);
            }
        };
        fetchPopups();
    }, []);

    const handleClose = (popup, closeType) => {
        if (closeType === 'today') {
            const closedPopups = JSON.parse(localStorage.getItem('closedPopups') || '{}');
            closedPopups[popup.id] = new Date().toDateString();
            localStorage.setItem('closedPopups', JSON.stringify(closedPopups));
        }
        setVisiblePopups(prev => ({ ...prev, [popup.id]: true }));
    };

    return (
        <>
            {popups.map(popup => (
                !visiblePopups[popup.id] && popup.display_type === 'popup' && (
                    <Modal
                        key={popup.id}
                        open={true}
                        footer={null}
                        closable={true}
                        onCancel={() => handleClose(popup, 'session')}
                        width={popup.width || 'auto'}
                        className={styles.popupModal}
                        bodyStyle={{ padding: 0 }}
                        centered
                    >
                        <div className={styles.popupBody}>
                            {popup.link_url ? (
                                <a href={popup.link_url} target="_blank" rel="noopener noreferrer">
                                    <img src={popup.image_url} alt={popup.title} className={styles.popupImage} />
                                </a>
                            ) : (
                                <img src={popup.image_url} alt={popup.title} className={styles.popupImage} />
                            )}
                        </div>

                        {(popup.close_option?.length > 0) && (
                            <div className={styles.popupFooter}>
                                {popup.close_option.includes('today') && (
                                    <Button ghost type="text" className={styles.footerButton} onClick={() => handleClose(popup, 'today')}>
                                        1일 동안 보지 않음
                                    </Button>
                                )}
                                {popup.close_option.includes('close') && (
                                    <Button ghost type="text" className={styles.footerButton} onClick={() => handleClose(popup, 'session')}>
                                        닫기
                                    </Button>
                                )}
                            </div>
                        )}
                    </Modal>
                )
            ))}
        </>
    );
};

export default PopupDisplay; 