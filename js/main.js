// YouTube 썸네일 URL 생성 함수
function getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// YouTube 시청 URL 생성 함수
function getWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

// 캐러셀 동적 생성 함수
function createCarousel(videos) {
    const carouselInner = document.getElementById('carouselInner');
    const carouselIndicators = document.getElementById('carouselIndicators');

    videos.forEach((video, index) => {
        // 캐러셀 아이템 생성
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;

        carouselItem.innerHTML = `
                    <a href="${getWatchUrl(video.id)}" target="_blank" class="text-decoration-none">
                        <div class="position-relative">
                            <img src="${getThumbnailUrl(video.id)}" 
                                 class="d-block w-100" 
                                 alt="${video.title}"
                                 style="height: 400px; object-fit: cover;">
                        </div>
                    </a>
                `;

        carouselInner.appendChild(carouselItem);

        // 인디케이터 생성
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.setAttribute('data-bs-target', '#videoCarousel');
        indicator.setAttribute('data-bs-slide-to', index.toString());
        if (index === 0) {
            indicator.className = 'active';
            indicator.setAttribute('aria-current', 'true');
        }
        indicator.setAttribute('aria-label', `Slide ${index + 1}`);

        carouselIndicators.appendChild(indicator);
    });
}

// 실제 JSON 파일에서 데이터를 불러오는 함수
async function loadVideoData() {
    try {
        const response = await fetch('../asset/video.json');
        const videoData = await response.json();

        createCarousel(videoData);
    } catch (error) {
        console.error('비디오 데이터를 불러오는 중 오류 발생:', error);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadVideoData);