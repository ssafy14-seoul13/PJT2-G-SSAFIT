// dashboard.js

// ===== 공통 상수/유틸 =====
const STORAGE_KEY = 'ssafit:user';
const SESSION_KEY = 'ssafit:session';

function readUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// 로그아웃 함수
function logout() {
    window.location.href = '../index.html';
}

// YouTube 썸네일 URL 생성 함수
function getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// 개별 비디오 페이지 URL 생성 함수
function getVideoDetailUrl(videoId) {
    return `video-detail.html?id=${videoId}`;
}

// 비디오 캐러셀을 동적으로 생성하는 범용 함수
function createVideoCarousel(containerId, videos) {
    const carouselInner = document.getElementById(containerId);
    const carouselIndicators = document.getElementById(containerId.replace('Inner', 'Indicators'));

    if (!carouselInner || !carouselIndicators) {
        console.error(`요소 ID '${containerId}' 또는 '${containerId.replace('Inner', 'Indicators')}'를 찾을 수 없습니다.`);
        return;
    }

    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';

    if (videos.length === 0) {
        carouselInner.innerHTML = `<div class="p-5 text-center text-muted">표시할 영상이 없습니다.</div>`;
        const carouselControls = document.querySelector(`#${containerId.replace('Inner', 'Carousel')} .carousel-control-prev`);
        if (carouselControls) {
            carouselControls.style.display = 'none';
            document.querySelector(`#${containerId.replace('Inner', 'Carousel')} .carousel-control-next`).style.display = 'none';
        }
        return;
    }

    const carouselControls = document.querySelector(`#${containerId.replace('Inner', 'Carousel')} .carousel-control-prev`);
    if (carouselControls) {
        carouselControls.style.display = '';
        document.querySelector(`#${containerId.replace('Inner', 'Carousel')} .carousel-control-next`).style.display = '';
    }

    // 비디오 ID 중복 제거를 위한 Map
    const uniqueVideos = new Map();
    videos.forEach(video => {
        if (!uniqueVideos.has(video.id)) {
            uniqueVideos.set(video.id, video);
        }
    });

    Array.from(uniqueVideos.values()).forEach((video, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;

        carouselItem.innerHTML = `
            <a href="${getVideoDetailUrl(video.id)}" class="text-decoration-none">
                <div class="position-relative">
                    <img src="${getThumbnailUrl(video.id)}"
                         class="d-block w-100"
                         alt="${video.title}"
                         style="height: 450px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/1280x720/cccccc/666666?text=Video+Thumbnail'">
                    <div class="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white p-3">
                        <h6 class="mb-1">${video.title}</h6>
                        <p class="mb-0 small">${video.channelName || '채널명 없음'}</p>
                    </div>
                </div>
            </a>
        `;
        carouselInner.appendChild(carouselItem);

        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.setAttribute('data-bs-target', `#${containerId.replace('Inner', 'Carousel')}`);
        indicator.setAttribute('data-bs-slide-to', index.toString());
        if (index === 0) {
            indicator.className = 'active';
            indicator.setAttribute('aria-current', 'true');
        }
        indicator.setAttribute('aria-label', `Slide ${index + 1}`);
        carouselIndicators.appendChild(indicator);
    });
}

// YouTube URL에서 비디오 ID 추출 함수 (추가)
function getYouTubeId(url) {
    if (!url) return null;
    let id = '';
    url = url.replace(/(>|<)/gi, '').split(/(\/embed\/|\/v\/|\/watch\?v=|\/youtu.be\/|\/shorts\/)/);
    if (url[2] !== undefined) {
        id = url[2].split(/[^0-9a-z_\-]/i);
        id = id[0];
    } else {
        id = url[0];
    }
    return id;
}

// 가상 사용자 정보 및 데이터 로드 함수
async function loadUserData() {
    // 1. 기존 video.json 파일의 영상 목록을 가져옵니다.
    const popularVideosResponse = await fetch('../asset/json/video.json');
    const popularVideos = await popularVideosResponse.json();

    const user = readUser();
    const displayUserName = user?.nickname || user?.email || '방문자';

    // 2. 로컬 스토리지에서 사용자가 추가한 '계획' 비디오를 가져옵니다.
    const plans = JSON.parse(localStorage.getItem('workoutPlans') || '{}');
    const plannedVideos = [];
    for (const day in plans) {
        plans[day].forEach(plan => {
            if (plan.videoId) {
                plannedVideos.push({
                    id: plan.videoId,
                    title: `${plan.part} - ${plan.memo || '운동 영상'}`,
                    channelName: '나의 계획'
                });
            }
        });
    }

    // 3. 로컬 스토리지에서 사용자가 직접 '등록'한 비디오를 가져옵니다.
    const uploadedVideos = JSON.parse(localStorage.getItem('ssafit:customVideos') || '[]');

    // 4. 세 가지 영상 목록(인기, 계획, 등록)을 모두 합칩니다. 중복은 제거합니다.
    const combinedVideos = new Map();
    [...popularVideos, ...plannedVideos, ...uploadedVideos].forEach(video => {
        if (!combinedVideos.has(video.id)) {
            combinedVideos.set(video.id, video);
        }
    });

    const userInfo = {
        userName: displayUserName,
        followingCount: 5,
        followerCount: 10,
        likedVideos: popularVideos.slice(0, 3),
        subscriptions: [
            { id: 'UCbF7uD01oK8vNf0d_s4', name: 'Smash Mouth' },
            { id: 'UCtGq44s_523cO2t6Qx0d', name: 'Darude' }
        ]
    };

    // UI 업데이트
    const greetingEl = document.getElementById('userName');
    if (greetingEl) {
        greetingEl.textContent = userInfo.userName;
    }
    const profileNameEl = document.querySelector('.text-center .fw-bold');
    if (profileNameEl) {
        profileNameEl.textContent = userInfo.userName;
    }
    document.getElementById('followingCount').textContent = userInfo.followingCount;
    document.getElementById('followerCount').textContent = userInfo.followerCount;
    document.getElementById('likedCount').textContent = `${userInfo.likedVideos.length}개`;
    document.getElementById('subscriptionCount').textContent = `${userInfo.subscriptions.length}명`;

    return { popularVideos: Array.from(combinedVideos.values()), userInfo };
}

// 운동 계획을 로컬 스토리지에서 로드하고 화면에 표시하는 함수
function loadWorkoutPlans() {
    const plans = JSON.parse(localStorage.getItem('workoutPlans') || '{}');
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    weekdays.forEach(day => {
        const container = document.getElementById(`${day}-plans`);
        if (container) {
            container.innerHTML = ''; // 기존 내용 초기화
            if (plans[day] && plans[day].length > 0) {
                plans[day].forEach((plan, index) => {
                    const planElement = document.createElement('div');
                    planElement.className = 'd-flex align-items-start my-2 p-2 border rounded bg-light';

                    let videoLink = '';
                    if (plan.videoId) {
                        videoLink = `<a href="${getVideoDetailUrl(plan.videoId)}" class="text-decoration-none ms-auto"><i class="bi bi-play-circle-fill fs-4 text-primary"></i></a>`;
                    }

                    planElement.innerHTML = `
                        <input type="checkbox" class="form-check-input mt-1 me-2" id="plan-${day}-${index}" ${plan.completed ? 'checked' : ''}>
                        <div class="flex-grow-1">
                            <label for="plan-${day}-${index}" class="form-check-label ${plan.completed ? 'text-decoration-line-through text-muted' : ''}">
                                <h6 class="mb-0">${plan.part} (${plan.time}분)</h6>
                                ${plan.memo ? `<p class="mb-0 small text-muted">${plan.memo}</p>` : ''}
                            </label>
                        </div>
                        ${videoLink}
                    `;
                    container.appendChild(planElement);
                });
            } else {
                container.innerHTML = `<div class="text-center text-muted small mt-4">계획이 없습니다.</div>`;
            }
        }
    });
}


// 운동 계획 저장 버튼 클릭 이벤트 리스너
function setupSavePlanButton() {
    const savePlanBtn = document.getElementById('savePlanBtn');
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', function() {
            const form = document.getElementById('workoutPlanForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const day = document.getElementById('workoutDay').value;
            const part = document.getElementById('workoutPart').value;
            const time = document.getElementById('workoutTime').value;
            const memo = document.getElementById('workoutMemo').value;

            // 로컬 스토리지에서 기존 계획을 가져옵니다.
            const plans = JSON.parse(localStorage.getItem('workoutPlans') || '{}');
            if (!plans[day]) {
                plans[day] = [];
            }
            
            // 새 계획을 추가합니다.
            plans[day].push({ part, time, memo, completed: false, videoId: 'e2kRk25a07c' });
            
            // 변경된 계획을 로컬 스토리지에 저장합니다.
            localStorage.setItem('workoutPlans', JSON.stringify(plans));

            // 모달을 숨깁니다.
            const workoutPlanModal = bootstrap.Modal.getInstance(document.getElementById('workoutPlanModal'));
            workoutPlanModal.hide();

            // 폼을 초기화합니다.
            form.reset();

            // 대시보드의 운동 계획을 다시 로드합니다.
            loadWorkoutPlans();
        });
    }
}

// 영상 등록 버튼 이벤트 리스너 (추가)
function setupVideoCreateButton() {
    const createVideoBtn = document.getElementById('btnCreateVideo');
    if (createVideoBtn) {
        createVideoBtn.addEventListener('click', function(event) {
            event.preventDefault(); // 폼 전송 방지

            const form = document.getElementById('videoCreateForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const title = document.getElementById('cv-title').value.trim();
            const url = document.getElementById('cv-url').value.trim();
            const channelName = document.getElementById('cv-channel').value.trim();
            const part = document.getElementById('cv-part').value;
            const duration = document.getElementById('cv-duration').value;
            const videoId = getYouTubeId(url); // YouTube URL에서 비디오 ID 추출
            const myEmail = readUser()?.email;

            if (!videoId) {
                alert('올바른 YouTube URL을 입력해주세요.');
                return;
            }

            // localStorage에서 기존 영상 목록을 가져옵니다.
            const uploadedVideos = JSON.parse(localStorage.getItem('ssafit:customVideos') || '[]');

            // 새 영상 정보를 추가합니다.
            const newVideo = {
                id: videoId,
                title: title,
                channelName: channelName,
                part: part,
                duration: duration,
                url: `https://www.youtube.com/embed/${videoId}`,
                ownerEmail: myEmail
            };
            uploadedVideos.push(newVideo);
            
            // 변경된 영상 목록을 localStorage에 저장합니다.
            localStorage.setItem('ssafit:customVideos', JSON.stringify(uploadedVideos));

            // 모달을 닫습니다.
            const videoCreateModal = bootstrap.Modal.getInstance(document.getElementById('videoCreateModal'));
            videoCreateModal.hide();
            
            // 폼을 초기화합니다.
            form.reset();
            
            alert('영상이 성공적으로 등록되었습니다!');
            
            // 캐러셀을 다시 로드하여 변경사항 반영
            loadAndRenderCarousels();
        });
    }
}


// 체크박스 클릭 이벤트 리스너 설정
function setupCheckboxListeners() {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    weekdays.forEach(day => {
        const container = document.getElementById(`${day}-plans`);
        if (container) {
            container.addEventListener('change', function(event) {
                if (event.target.type === 'checkbox') {
                    const plans = JSON.parse(localStorage.getItem('workoutPlans') || '{}');
                    const index = parseInt(event.target.id.split('-')[2]);
                    const plan = plans[day][index];

                    plan.completed = event.target.checked;
                    
                    localStorage.setItem('workoutPlans', JSON.stringify(plans));
                    loadWorkoutPlans(); // 화면 업데이트를 위해 다시 로드
                }
            });
        }
    });
}

// 캐러셀 및 운동 계획 로드 및 렌더링을 위한 통합 함수 (추가)
async function loadAndRenderCarousels() {
    const { popularVideos, userInfo } = await loadUserData();

    // '인기 영상' 캐러셀을 업데이트된 popularVideos로 생성
    createVideoCarousel('popularCarouselInner', popularVideos);

    const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', async function(event) {
            const targetTab = event.target.getAttribute('href');

            if (targetTab === '#liked-videos') {
                createVideoCarousel('likedCarouselInner', userInfo.likedVideos);
            } else if (targetTab === '#subscribed-videos') {
                const subscribedVideos = await getVideosFromSubscriptions(userInfo.subscriptions);
                createVideoCarousel('subscribedCarouselInner', subscribedVideos);
            } else if (targetTab === '#popular-videos') {
                createVideoCarousel('popularCarouselInner', popularVideos);
            }
        });
    });

    // 페이지 로드 시 저장된 운동 계획을 표시
    loadWorkoutPlans();
}


// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', async function() {
    loadAndRenderCarousels();

    // 저장 버튼에 이벤트 리스너 설정
    setupSavePlanButton();

    // 영상 등록 버튼에 이벤트 리스너 설정
    setupVideoCreateButton();
    
    // 체크박스에 이벤트 리스너 설정
    setupCheckboxListeners();

    // 모달을 수동으로 초기화하여 안정성 확보
    const workoutPlanModal = document.getElementById('workoutPlanModal');
    if (workoutPlanModal) {
        new bootstrap.Modal(workoutPlanModal);
    }
});