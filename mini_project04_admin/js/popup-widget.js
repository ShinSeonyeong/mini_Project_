// 팝업 위젯 스크립트
(function() {
    // 팝업 데이터를 저장할 변수
    let popupData = null;
    let isInitialized = false;
    let isAdminPage = false;

    // URL에서 팝업 데이터를 가져오는 함수
    function getPopupDataFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const popupParam = urlParams.get('popup');
        if (popupParam) {
            try {
                return JSON.parse(decodeURIComponent(popupParam));
            } catch (e) {
                console.error('팝업 데이터 파싱 오류:', e);
                return null;
            }
        }
        return null;
    }

    // 현재 페이지가 관리자 페이지인지 확인하는 함수
    function checkAdminPage() {
        // 1. React 앱 체크
        const rootElement = document.getElementById('root');
        if (rootElement) {
            // React 앱의 경우 특별한 처리가 필요
            const reactApp = rootElement.querySelector('[data-reactroot]');
            if (reactApp) {
                // React 앱의 경우 항상 관리자 페이지로 간주
                return true;
            }
        }

        // 2. 기본 체크
        const path = window.location.pathname.toLowerCase();
        const hostname = window.location.hostname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        
        // 3. URL 기반 체크
        const adminKeywords = ['admin', 'dashboard', 'manager', 'administrator', 'ice-care-admin', 'ice-care-dashboard'];
        for (const keyword of adminKeywords) {
            if (path.includes(`/${keyword}/`) || hostname.includes(`${keyword}.`)) {
                return true;
            }
        }

        // 4. 쿼리 파라미터 체크
        const adminParams = ['admin', 'dashboard', 'manager', 'administrator'];
        for (const param of adminParams) {
            if (searchParams.has(param) || searchParams.get('page') === param) {
                return true;
            }
        }

        // 5. DOM 구조 체크
        const adminSelectors = [
            '.admin-header', '.admin-sidebar', '.admin-footer', '.admin-container', '.admin-wrapper',
            '.dashboard-header', '.dashboard-sidebar', '.dashboard-footer', '.dashboard-container', '.dashboard-wrapper',
            '[class*="admin"]', '[id*="admin"]', '[class*="dashboard"]', '[id*="dashboard"]',
            '[class*="ice-care"]', '[id*="ice-care"]'
        ];

        for (const selector of adminSelectors) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        // 6. 특정 텍스트나 요소 체크
        const adminTexts = ['관리자', '대시보드', 'Dashboard', 'Admin', 'Manager'];
        const bodyText = document.body.innerText.toLowerCase();
        for (const text of adminTexts) {
            if (bodyText.includes(text.toLowerCase())) {
                return true;
            }
        }

        // 7. 메타 태그 체크
        const metaTags = document.getElementsByTagName('meta');
        for (const meta of metaTags) {
            const content = (meta.getAttribute('content') || '').toLowerCase();
            if (adminKeywords.some(keyword => content.includes(keyword))) {
                return true;
            }
        }

        // 8. 특정 스크립트나 스타일시트 체크
        const scripts = document.getElementsByTagName('script');
        const styles = document.getElementsByTagName('link');
        
        for (const script of scripts) {
            const src = (script.getAttribute('src') || '').toLowerCase();
            if (adminKeywords.some(keyword => src.includes(keyword))) {
                return true;
            }
        }

        // 9. 추가 체크: React Router 기반 체크
        if (window.location.pathname === '/' || 
            window.location.pathname === '/dashboard' || 
            window.location.pathname === '/admin' ||
            window.location.pathname.includes('/ice-care')) {
            return true;
        }

        return false;
    }

    // 팝업 위치 업데이트 함수
    function updatePopupPosition(popupElement, position) {
        if (position) {
            popupElement.style.top = position.top + 'px';
            popupElement.style.left = position.left + 'px';
            popupElement.style.transform = 'none';
        }
    }

    // 팝업 HTML 생성 함수
    function createPopupHTML(popup) {
        return `
            <div class="ice-popup" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 80%;
                max-height: 80vh;
                overflow-y: auto;
                cursor: move;
                user-select: none;
            ">
                <div class="ice-popup-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    cursor: move;
                ">
                    <h3 style="margin: 0;">${popup.title || '팝업'}</h3>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: none;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                    ">×</button>
                </div>
                <div class="ice-popup-content">
                    ${popup.content || ''}
                </div>
            </div>
            <div class="ice-popup-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            "></div>
        `;
    }

    // 팝업 표시 함수
    function showPopup(popup) {
        // 관리자 페이지인 경우 팝업을 표시하지 않음
        if (isAdminPage) {
            return;
        }

        const popupHTML = createPopupHTML(popup);
        const popupContainer = document.createElement('div');
        popupContainer.innerHTML = popupHTML;
        document.body.appendChild(popupContainer);

        const popupElement = popupContainer.querySelector('.ice-popup');
        const overlay = popupContainer.querySelector('.ice-popup-overlay');

        // 드래그 기능 추가
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // 헤더와 팝업 전체에 드래그 이벤트 추가
        const header = popupElement.querySelector('.ice-popup-header');
        [header, popupElement].forEach(element => {
            element.addEventListener('mousedown', dragStart);
        });

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.tagName === 'BUTTON') return; // 닫기 버튼 클릭 시 드래그 방지
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                // transform 대신 top/left 사용
                popupElement.style.top = (currentY + window.scrollY) + 'px';
                popupElement.style.left = (currentX + window.scrollX) + 'px';
                popupElement.style.transform = 'none';
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;

            // 위치 정보 저장
            const rect = popupElement.getBoundingClientRect();
            const position = {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX
            };

            // 위치 정보를 부모 창으로 전달
            if (window.opener) {
                window.opener.postMessage({
                    type: 'popupPositionUpdate',
                    position: position
                }, '*');
            }
        }

        // 저장된 위치가 있으면 적용
        if (popup.position) {
            updatePopupPosition(popupElement, popup.position);
        }

        // 오버레이 클릭 시 팝업 닫기
        overlay.addEventListener('click', () => {
            popupContainer.remove();
        });
    }

    // 초기화 함수
    function init() {
        // 이미 초기화되었으면 중복 실행 방지
        if (isInitialized) {
            return;
        }

        // 관리자 페이지 여부 확인
        isAdminPage = checkAdminPage();

        // 관리자 페이지인 경우 팝업을 표시하지 않음
        if (isAdminPage) {
            console.log('관리자 페이지 감지: 팝업 비활성화');
            isInitialized = true;
            return;
        }

        // URL에서 팝업 데이터 가져오기
        popupData = getPopupDataFromUrl();
        
        if (popupData) {
            showPopup(popupData);
        }

        isInitialized = true;
    }

    // 페이지 로드 시 초기화
    window.addEventListener('load', init);

    // React 앱의 경우 라우트 변경 감지
    if (window.history && window.history.pushState) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function() {
            originalPushState.apply(this, arguments);
            // 라우트 변경 시 다시 체크
            setTimeout(() => {
                isAdminPage = checkAdminPage();
                if (!isAdminPage) {
                    popupData = getPopupDataFromUrl();
                    if (popupData) {
                        showPopup(popupData);
                    }
                }
            }, 0);
        };
    }

    // React 앱의 경우 클릭 이벤트 감지
    document.addEventListener('click', function(e) {
        // 대시보드 관련 요소 클릭 시 팝업 표시 방지
        if (e.target.closest('.dashboard') || 
            e.target.closest('[class*="dashboard"]') || 
            e.target.closest('[id*="dashboard"]') ||
            e.target.closest('.ice-care') ||
            e.target.closest('[class*="ice-care"]') ||
            e.target.closest('[id*="ice-care"]')) {
            isAdminPage = true;
        }
    });
})(); 