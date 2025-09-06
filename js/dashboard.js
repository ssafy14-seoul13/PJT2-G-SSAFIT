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

    videos.forEach((video, index) => {
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

// 가상 사용자 정보 및 데이터 로드 함수
async function loadUserData() {
    const popularVideosResponse = await fetch('../asset/json/video.json');
    const popularVideos = await popularVideosResponse.json();

    const userInfo = {
        userName: 'SSAFY',
        followingCount: 5,
        followerCount: 10,
        likedVideos: popularVideos.slice(0, 3),
        subscriptions: [
            { id: 'UCbF7uD01oK8vNf0d_s4', name: 'Smash Mouth' },
            { id: 'UCtGq44s_523cO2t6Qx0d', name: 'Darude' }
        ]
    };

    document.getElementById('userName').textContent = userInfo.userName;
    document.getElementById('followingCount').textContent = userInfo.followingCount;
    document.getElementById('followerCount').textContent = userInfo.followerCount;
    document.getElementById('likedCount').textContent = `${userInfo.likedVideos.length}개`;
    document.getElementById('subscriptionCount').textContent = `${userInfo.subscriptions.length}명`;

    return { popularVideos, userInfo };
}

// 가상으로 구독 채널의 영상 목록을 가져오는 함수
async function getVideosFromSubscriptions(subscriptions) {
    const allVideos = await fetch('../asset/json/video.json').then(res => res.json());
    
    const subscribedVideos = allVideos.filter(video => 
        subscriptions.some(sub => sub.name === video.channelName)
    );
    
    return subscribedVideos;
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
                    planElement.innerHTML = `
                        <input type="checkbox" class="form-check-input mt-1 me-2" id="plan-${day}-${index}" ${plan.completed ? 'checked' : ''}>
                        <div class="flex-grow-1">
                            <label for="plan-${day}-${index}" class="form-check-label ${plan.completed ? 'text-decoration-line-through text-muted' : ''}">
                                <h6 class="mb-0">${plan.part} (${plan.time}분)</h6>
                                ${plan.memo ? `<p class="mb-0 small text-muted">${plan.memo}</p>` : ''}
                            </label>
                        </div>
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
            plans[day].push({ part, time, memo, completed: false });
            
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

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', async function() {
    const { popularVideos, userInfo } = await loadUserData();
    
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
    
    // 저장 버튼에 이벤트 리스너 설정
    setupSavePlanButton();

    // 체크박스에 이벤트 리스너 설정
    setupCheckboxListeners();

    // 모달을 수동으로 초기화하여 안정성 확보
    const workoutPlanModal = document.getElementById('workoutPlanModal');
    if (workoutPlanModal) {
        new bootstrap.Modal(workoutPlanModal);
    }
});

// dashboard.js 파일의 수정된 내용

// ===== 공통 상수/유틸 추가 =====
// account.js와 동일한 유틸리티 함수를 추가하여 localStorage에서 사용자 정보를 읽어옵니다.
const STORAGE_KEY = 'ssafit:user';
const SESSION_KEY = 'ssafit:session';

function readUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// ===== 기존 loadUserData 함수를 아래 코드로 대체 =====
async function loadUserData() {
    const popularVideosResponse = await fetch('../asset/json/video.json');
    const popularVideos = await popularVideosResponse.json();

    // 로컬 스토리지에서 사용자 정보 객체를 읽어옵니다.
    const user = readUser();

    // 사용자 정보가 없으면 기본값 설정
    const displayUserName = user?.nickname || user?.email || 'SSAFY';

    const userInfo = {
        userName: displayUserName,
        // 나머지 데이터는 기존과 동일하게 유지
        followingCount: 5,
        followerCount: 10,
        likedVideos: popularVideos.slice(0, 3),
        subscriptions: [
            { id: 'UCbF7uD01oK8vNf0d_s4', name: 'Smash Mouth' },
            { id: 'UCtGq44s_523cO2t6Qx0d', name: 'Darude' }
        ]
    };

    // HTML 요소 업데이트
    // 첫 번째 '안녕하세요, OOO님' 텍스트를 업데이트합니다.
    const greetingEl = document.getElementById('userName');
    if (greetingEl) {
        greetingEl.textContent = userInfo.userName;
    }
    
    // 두 번째 프로필 사진 아래의 사용자명을 업데이트합니다.
    const profileNameEl = document.querySelector('.text-center .fw-bold');
    if (profileNameEl) {
        profileNameEl.textContent = userInfo.userName;
    }

    document.getElementById('followingCount').textContent = userInfo.followingCount;
    document.getElementById('followerCount').textContent = userInfo.followerCount;
    document.getElementById('likedCount').textContent = `${userInfo.likedVideos.length}개`;
    document.getElementById('subscriptionCount').textContent = `${userInfo.subscriptions.length}명`;

    return { popularVideos, userInfo };
}

// ... 나머지 dashboard.js 코드는 그대로 유지 ...