// YouTube 썸네일 URL 생성 함수
function getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// YouTube 시청 URL 생성 함수
function getWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

// 개별 비디오 페이지 URL 생성 함수
function getVideoDetailUrl(videoId) {
    return `video-detail.html?id=${videoId}`;
}

// 캐러셀 동적 생성 함수
function createCarousel(videos) {
    console.log('createCarousel 호출됨, 비디오 개수:', videos.length); // 디버깅용
    
    const carouselInner = document.getElementById('popularCarouselInner');
    const carouselIndicators = document.getElementById('popularCarouselIndicators');

    // 요소가 존재하는지 확인
    if (!carouselInner) {
        console.error('popularCarouselInner 요소를 찾을 수 없습니다.');
        return;
    }
    if (!carouselIndicators) {
        console.error('popularCarouselIndicators 요소를 찾을 수 없습니다.');
        return;
    }

    // 기존 내용 초기화
    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';

    videos.forEach((video, index) => {
        console.log(`비디오 ${index + 1} 처리 중:`, video.title); // 디버깅용
        
        // 캐러셀 아이템 생성
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

        // 인디케이터 생성
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.setAttribute('data-bs-target', '#popularVideoCarousel');
        indicator.setAttribute('data-bs-slide-to', index.toString());
        if (index === 0) {
            indicator.className = 'active';
            indicator.setAttribute('aria-current', 'true');
        }
        indicator.setAttribute('aria-label', `Slide ${index + 1}`);

        carouselIndicators.appendChild(indicator);
    });
    
    console.log('캐러셀 생성 완료'); // 디버깅용
}

// 실제 JSON 파일에서 데이터를 불러오는 함수
async function loadVideoData() {
    try {
        console.log('비디오 데이터 로딩 시작...'); // 디버깅용
        
        // JSON 파일에서 데이터 로드 시도
        const response = await fetch('./asset/json/video.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const videoData = await response.json();
        console.log('로드된 비디오 데이터:', videoData); // 디버깅용
        
        if (videoData && videoData.length > 0) {
            createCarousel(videoData);
        } else {
            console.warn('비디오 데이터가 비어있습니다.');
            // 샘플 데이터로 테스트
            createCarouselWithSampleData();
        }
        
    } catch (error) {
        console.error('비디오 데이터를 불러오는 중 오류 발생:', error);
        console.log('샘플 데이터로 대체합니다.');
        
        // 오류 발생 시 샘플 데이터로 테스트
        createCarouselWithSampleData();
    }
}

// 샘플 데이터로 캐러셀 생성 (테스트용)
function createCarouselWithSampleData() {
    const sampleData = [
        {
            "id": "dQw4w9WgXcQ",
            "title": "Rick Astley - Never Gonna Give You Up",
            "channelName": "Rick Astley"
        },
        {
            "id": "L_jWHffIx5E",
            "title": "Smash Mouth - All Star",
            "channelName": "Smash Mouth"
        },
        {
            "id": "y6120QOlsfU",
            "title": "Darude - Sandstorm",
            "channelName": "Darude"
        }
    ];
    
    console.log('샘플 데이터로 캐러셀 생성:', sampleData);
    createCarousel(sampleData);
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료, 비디오 데이터 로딩 시작');
    loadVideoData();
});

// 탭 전환 이벤트 리스너 (옵션)
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetTab = event.target.getAttribute('href');
            
            if (targetTab === '#liked-videos') {
                console.log('찜한 동영상 탭 활성화');
                // 추후 찜한 동영상 로드 로직 추가
            } else if (targetTab === '#subscribed-videos') {
                console.log('구독한 영상 탭 활성화');
                // 추후 구독한 영상 로드 로직 추가
            }
        });
    });
});

// 로그인 처리
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    handleLogin();
});

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 실제로는 서버로 요청을 보내야 하지만, 여기서는 localStorage 시뮬레이션
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // 로그인 성공
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('로그인 성공!');
        window.location.href = './pages/dashboard.html';
    } else {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
}

function handleSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const name = document.getElementById('signupName').value;

    if (!email || !password || !passwordConfirm || !name) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 기존 사용자 확인
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('이미 가입된 이메일입니다.');
        return;
    }

    // 새 사용자 생성 (샘플 데이터 포함)
    const newUser = {
        id: Date.now(),
        email: email,
        password: password,
        name: name,
        likedVideos: ['dQw4w9WgXcQ'], // 샘플 찜한 영상
        subscriptions: ['UCuAXFkgsw1L7xaCfnd5JJOw'], // 샘플 구독 채널
        workoutPlans: {
            monday: [{ part: '가슴', time: 60, memo: '벤치프레스 위주' }],
            tuesday: [{ part: '등', time: 90, memo: '' }],
            wednesday: [],
            thursday: [{ part: '하체', time: 120, memo: '스쿼트 데드리프트' }],
            friday: [{ part: '어깨', time: 75, memo: '' }],
            saturday: [{ part: '팔', time: 60, memo: '' }, { part: '복근', time: 20, memo: '' }],
            sunday: []
        }
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('회원가입이 완료되었습니다!');
    
    // 모달 닫기 및 폼 리셋
    const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    modal.hide();
    document.getElementById('signupForm').reset();
}

// // 페이지 로드 시 이미 로그인된 사용자 확인
// window.addEventListener('load', function() {
//     const currentUser = localStorage.getItem('currentUser');
//     if (currentUser) {
//         window.location.href = './pages/dashboard.html';
//     }
// });