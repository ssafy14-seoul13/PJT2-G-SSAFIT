// ../js/video.js  (video.html 이 pages/ 안에 있을 때 로드 경로: ../js/video.js)

/* ========================
   커스텀 영상 저장소(localStorage)
======================== */
const CUSTOM_KEY = "ssafit:customVideos";
function loadCustomVideos() {
  return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
}
function saveCustomVideos(arr) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
}

/* ========================
   YouTube URL → id 추출 & 임베드 URL 생성
======================== */
function parseYoutubeId(anyUrl) {
  if (!anyUrl) return null;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{6,})/,     // watch?v=
    /youtu\.be\/([A-Za-z0-9_-]{6,})/, // youtu.be/
    /embed\/([A-Za-z0-9_-]{6,})/,     // /embed/
    /shorts\/([A-Za-z0-9_-]{6,})/     // /shorts/
  ];
  for (const p of patterns) {
    const m = anyUrl.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}
function toEmbedUrl(id) {
  return `https://www.youtube.com/embed/${id}`;
}

/* ========================
   영상 등록 폼 처리 (모달)
======================== */
const createForm = document.querySelector("#videoCreateForm");
createForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const title    = document.querySelector("#cv-title")?.value.trim();
  const urlRaw   = document.querySelector("#cv-url")?.value.trim();
  const channel  = document.querySelector("#cv-channel")?.value.trim();
  const part     = document.querySelector("#cv-part")?.value;
  const duration = Number(document.querySelector("#cv-duration")?.value);

  if (!title || !urlRaw || !channel || !part || !duration) {
    alert("모든 필드를 입력해주세요.");
    return;
  }

  const yid = parseYoutubeId(urlRaw);
  if (!yid) {
    alert("유효한 YouTube URL을 입력해주세요.");
    return;
  }

  const newVideo = {
    id: yid,
    title,
    part,
    channelName: channel,
    url: toEmbedUrl(yid),
    duration
  };

  // 커스텀 영상 저장/병합(중복 id는 업데이트)
  const custom = loadCustomVideos();
  const existIdx = custom.findIndex(v => v.id === newVideo.id);
  if (existIdx >= 0) custom[existIdx] = newVideo;
  else custom.push(newVideo);
  saveCustomVideos(custom);

  // 현재 메모리 videos에도 병합
  const map = new Map(videos.map(v => [v.id, v]));
  map.set(newVideo.id, newVideo);
  videos = Array.from(map.values());

  // 모달 닫고 폼 리셋
  const modalEl = document.getElementById("videoCreateModal");
  const modal   = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.hide();
  createForm.reset();

  // 현재 선택된 필터 유지하여 목록 갱신
  filterVideos();
  // 바로 재생하고 싶다면 아래 주석 해제
  // renderVideo(newVideo);

  updateLikeCount();
});

/* ========================
   전역 상태
======================== */
const REVIEW_KEY = "ssafit:reviews";
const LIKE_KEY   = "ssafit:likes";
let videos = [];
let currentVideo = null;

/* ========================
   유틸
======================== */
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function genId() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
}
function fmtDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// YouTube 썸네일
function getYoutubeId(v) {
  if (v.id) return v.id;
  const m = v.url?.match(/embed\/([^?&/]+)/);
  return m ? m[1] : "";
}
function getThumb(v) {
  const id = getYoutubeId(v);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "https://via.placeholder.com/120x68?text=No+Thumb";
}

/* ========================
   리뷰 저장소
======================== */
function loadReviews(videoId) {
  const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || "{}");
  return all[videoId] || [];
}
function saveReviews(videoId, arr) {
  const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || "{}");
  all[videoId] = arr;
  localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
}

/* ========================
   찜 저장소
======================== */
function loadLikes() {
  return JSON.parse(localStorage.getItem(LIKE_KEY) || "[]");
}
function saveLikes(list) {
  localStorage.setItem(LIKE_KEY, JSON.stringify(list));
}
function updateLikeCount() {
  const el = $("#likeCount");
  if (el) el.textContent = loadLikes().length;
}
function toggleLike(video) {
  let likes = loadLikes();
  if (likes.find(v => v.id === video.id)) {
    likes = likes.filter(v => v.id !== video.id);
  } else {
    likes.push(video);
  }
  saveLikes(likes);
  updateLikeCount();
}

/* ========================
   DOM 참조
======================== */
const player      = $("iframe");
const reviewList  = $("#review-list");
const reviewForm  = $("#review-form");
const reviewInput = $("#review-input");
const likeBtn     = $("#likeBtn");
const resultCount = $("#resultCount");
const resultCards = $("#resultCards");

/* ========================
   렌더링
======================== */
function renderVideo(video) {
  currentVideo = video;
  if (player) player.src = video.url;
  const titleEl   = $("#video-title");
  const channelEl = $("#video-channel");
  const durEl     = $("#video-duration");
  if (titleEl)   titleEl.textContent   = video.title;
  if (channelEl) channelEl.textContent = video.channelName;
  if (durEl)     durEl.textContent     = `길이: ${video.duration}분`;
  renderReviews();
}

function renderReviews() {
  if (!reviewList || !currentVideo) return;
  const reviews = loadReviews(currentVideo.id);
  reviewList.innerHTML = "";

  if (reviews.length === 0) {
    reviewList.innerHTML = `<p class="text-secondary small mb-2">아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</p>`;
    return;
  }

  const list = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  list.forEach((r) => {
    const item = document.createElement("div");
    item.className = "border rounded p-2 mb-2";
    item.dataset.id = r.id;

    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="me-2">
          <div class="fw-semibold">${r.user || "익명"}</div>
          <div class="text-secondary small">${fmtDate(r.updatedAt || r.createdAt)}</div>
        </div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary btn-edit">수정</button>
          <button class="btn btn-outline-danger btn-del">삭제</button>
        </div>
      </div>
      <div class="mt-2">
        <p class="mb-0 review-text">${escapeHtml(r.text)}</p>
      </div>
    `;
    reviewList.appendChild(item);
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/* ========================
   리뷰 이벤트
======================== */
if (reviewForm) {
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentVideo) return;
    const text = reviewInput.value.trim();
    if (!text) return;

    const arr = loadReviews(currentVideo.id);
    arr.push({
      id: genId(),
      user: "익명",
      text,
      createdAt: new Date().toISOString(),
    });
    saveReviews(currentVideo.id, arr);
    reviewInput.value = "";
    renderReviews();
  });
}

if (reviewList) {
  reviewList.addEventListener("click", (e) => {
    const item = e.target.closest("[data-id]");
    if (!item || !currentVideo) return;
    const id  = item.dataset.id;
    const arr = loadReviews(currentVideo.id);
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return;

    // 삭제
    if (e.target.classList.contains("btn-del")) {
      if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
      arr.splice(idx, 1);
      saveReviews(currentVideo.id, arr);
      renderReviews();
      return;
    }

    // 수정
    if (e.target.classList.contains("btn-edit")) {
      const textEl   = item.querySelector(".review-text");
      const original = arr[idx].text;

      if (item.querySelector("textarea")) return; // 이미 편집중

      const editor = document.createElement("div");
      editor.className = "mt-2";
      editor.innerHTML = `
        <textarea class="form-control mb-2" rows="2">${original}</textarea>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm btn-save-edit">저장</button>
          <button class="btn btn-outline-secondary btn-sm btn-cancel-edit">취소</button>
        </div>
      `;
      textEl.classList.add("d-none");
      textEl.insertAdjacentElement("afterend", editor);

      // 저장
      editor.querySelector(".btn-save-edit").addEventListener("click", () => {
        const newText = editor.querySelector("textarea").value.trim();
        if (!newText) return alert("내용을 입력하세요.");
        arr[idx].text = newText;
        arr[idx].updatedAt = new Date().toISOString();
        saveReviews(currentVideo.id, arr);
        renderReviews();
      });

      // 취소
      editor.querySelector(".btn-cancel-edit").addEventListener("click", () => {
        editor.remove();
        textEl.classList.remove("d-none");
      });
    }
  });
}

/* ========================
   검색 결과 카드 렌더
======================== */
function renderResults(list) {
  if (!resultCards || !resultCount) return;
  resultCards.innerHTML = "";
  resultCount.textContent = list.length;

  if (list.length === 0) {
    resultCards.innerHTML = `<div class="text-secondary small">조건에 맞는 영상이 없습니다.</div>`;
    return;
  }

  list.forEach((v) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card p-2 text-start video-card";
    card.dataset.id = v.id;
    card.innerHTML = `
      <div class="d-flex gap-2">
        <img src="${getThumb(v)}" alt="${escapeHtml(v.title)}" width="120" height="68"
             class="rounded" style="object-fit:cover;">
        <div class="flex-grow-1">
          <div class="fw-semibold text-truncate" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</div>
          <div class="small text-secondary text-truncate">${escapeHtml(v.channelName)}</div>
          <div class="mt-1 d-flex gap-1">
            <span class="badge text-bg-light">${v.part}</span>
            <span class="badge text-bg-secondary">${v.duration}분</span>
          </div>
        </div>
      </div>
    `;
    resultCards.appendChild(card);
  });
}

// 카드 클릭 → 해당 영상 재생 (이벤트 위임)
if (resultCards) {
  resultCards.addEventListener("click", (e) => {
    const btn = e.target.closest(".video-card");
    if (!btn) return;
    const id = btn.dataset.id;
    const v  = videos.find(x => x.id === id);
    if (v) renderVideo(v);
  });
}

/* ========================
   필터 적용 (검색 버튼 눌러야 반영)
======================== */
function filterVideos() {
  const partEl   = document.querySelector("input[name='part']:checked");
  const part     = partEl ? partEl.nextElementSibling.textContent : "전체";
  const shortOnly= $("#shortOnly")?.checked;

  let list = [...videos];
  if (part && part !== "전체") {
    list = list.filter(v => v.part === part);
  }
  if (shortOnly) {
    list = list.filter(v => v.duration && v.duration <= 5);
  }

  renderResults(list);
  if (list.length > 0) {
    // 첫 카드 자동 재생 (원치 않으면 이 줄 주석)
    renderVideo(list[0]);
  }
}

/* ========================
   이벤트 등록
======================== */
$("#filterBtn")?.addEventListener("click", filterVideos);
$("#likeBtn")?.addEventListener("click", () => currentVideo && toggleLike(currentVideo));

/* ========================
   JSON 로드 (기본 + 커스텀 병합)
======================== */
async function loadVideos() {
  try {
    // pages/video.html 기준 상대경로 (asset/json 폴더)
    const res = await fetch("../asset/json/video.json");
    videos = await res.json();

    // 커스텀 영상 병합 (있으면 덮어쓰기)
    const custom = loadCustomVideos();
    if (custom.length) {
      const map = new Map(videos.map(v => [v.id, v]));
      custom.forEach(v => map.set(v.id, v));
      videos = Array.from(map.values());
    }

    // 초기: 전체 카드 렌더 + 첫 영상 재생
    renderResults(videos);
    if (videos.length > 0) renderVideo(videos[0]);
    updateLikeCount();

  } catch (e) {
    console.error("영상 데이터를 불러올 수 없습니다.", e);
  }
}

/* ========================
   초기 실행
======================== */
loadVideos();
