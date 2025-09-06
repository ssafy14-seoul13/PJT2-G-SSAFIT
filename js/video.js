// ../js/video.js  (pages/video.html에서 <script src="../js/video.js"></script>)

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
   로그인 세션 유틸 (currentUser / ssafit:session 둘 다 지원)
======================== */
const SESSION_KEY_CUR = "currentUser";      // main.js에서 저장하는 전체 유저 객체
const SESSION_KEY_LEG = "ssafit:session";   // { email, at } 형태 호환

function getSession() {
  // 1) currentUser 우선
  const rawCur = localStorage.getItem(SESSION_KEY_CUR);
  if (rawCur) {
    try {
      const u = JSON.parse(rawCur);
      if (u?.email) return { email: u.email, at: u.at || new Date().toISOString() };
    } catch {}
  }
  // 2) 레거시 키
  const rawLeg = localStorage.getItem(SESSION_KEY_LEG);
  if (rawLeg) {
    try { return JSON.parse(rawLeg); } catch {}
  }
  return null;
}
function isLoggedIn() {
  return !!getSession()?.email;
}
function me() {
  return getSession()?.email || null;
}

/* ========================
   YouTube URL → id 추출 & 임베드 URL 생성 (강화판)
======================== */
function parseYoutubeId(input) {
  if (!input) return null;
  // URL API 우선 시도
  try {
    const u = new URL(input);
    // youtu.be/<id>?...
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\/+/, "").slice(0, 11);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    // /embed/<id> 또는 /shorts/<id>
    const m = u.pathname.match(/\/(embed|shorts)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[2];
  } catch {}
  // fallback: 11자 토큰 스캔
  const m2 = String(input).match(/([A-Za-z0-9_-]{11})(?=[^A-Za-z0-9_-]|$)/);
  return m2 ? m2[1] : null;
}
function toEmbedUrl(id) {
  return `https://www.youtube.com/embed/${id}`;
}

/* ========================
   전역 상태/유틸
======================== */
const REVIEW_KEY = "ssafit:reviews";
const LIKE_KEY   = "ssafit:likes";
let videos = [];
let currentVideo = null;

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
const resultCount = $("#resultCount");
const resultCards = $("#resultCards");
const createForm  = $("#videoCreateForm");

/* ========================
   영상 등록 (모달) — 로그인 + 소유자 기록
======================== */
createForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const title    = $("#cv-title")?.value.trim();
  const urlRaw   = $("#cv-url")?.value.trim();
  const channel  = $("#cv-channel")?.value.trim();
  const part     = $("#cv-part")?.value;
  const duration = Number($("#cv-duration")?.value);

  if (!title || !urlRaw || !channel || !part || !duration) {
    alert("모든 필드를 입력해주세요.");
    return;
  }
  if (!isLoggedIn()) {
    alert("로그인 후 이용해주세요.");
    return;
  }

  const yid = parseYoutubeId(urlRaw);
  if (!yid) {
    alert("유효한 YouTube URL을 입력해주세요.");
    return;
  }

  const now = new Date().toISOString();
  const newVideo = {
    id: yid,
    title,
    part,
    channelName: channel,
    url: toEmbedUrl(yid),
    duration,
    ownerEmail: me(),
    createdAt: now,
    updatedAt: now,
    source: "user"
  };

  const custom = loadCustomVideos();
  const existIdx = custom.findIndex(v => v.id === newVideo.id && v.ownerEmail === newVideo.ownerEmail);
  if (existIdx >= 0) custom[existIdx] = { ...custom[existIdx], ...newVideo, updatedAt: now };
  else custom.push(newVideo);
  saveCustomVideos(custom);

  // 메모리 병합
  const map = new Map(videos.map(v => [v.id, v]));
  map.set(newVideo.id, newVideo);
  videos = Array.from(map.values());

  // 모달 닫기/리셋
  const modalEl = document.getElementById("videoCreateModal");
  const modal   = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.hide();
  createForm.reset();

  filterVideos();
  updateLikeCount();
});

/* ========================
   렌더링 (영상/리뷰)
======================== */
function renderVideo(video) {
  currentVideo = video;
  if (player) player.src = video.url;
  $("#video-title").textContent   = video.title;
  $("#video-channel").textContent = video.channelName ?? "";
  $("#video-duration").textContent = `길이: ${video.duration}분`;
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
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

/* ========================
   리뷰 이벤트
======================== */
reviewForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentVideo) return;
  const text = reviewInput.value.trim();
  if (!text) return;

  const arr = loadReviews(currentVideo.id);
  arr.push({ id: genId(), user: "익명", text, createdAt: new Date().toISOString() });
  saveReviews(currentVideo.id, arr);
  reviewInput.value = "";
  renderReviews();
});
reviewList?.addEventListener("click", (e) => {
  const item = e.target.closest("[data-id]");
  if (!item || !currentVideo) return;
  const id  = item.dataset.id;
  const arr = loadReviews(currentVideo.id);
  const idx = arr.findIndex(r => r.id === id);
  if (idx === -1) return;

  if (e.target.classList.contains("btn-del")) {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    arr.splice(idx, 1);
    saveReviews(currentVideo.id, arr);
    renderReviews();
    return;
  }

  if (e.target.classList.contains("btn-edit")) {
    const textEl   = item.querySelector(".review-text");
    const original = arr[idx].text;
    if (item.querySelector("textarea")) return;

    const editor = document.createElement("div");
    editor.className = "mt-2";
    editor.innerHTML = `
      <textarea class="form-control mb-2" rows="2">${original}</textarea>
      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm btn-save-edit">저장</button>
        <button class="btn btn-outline-secondary btn-sm btn-cancel-edit">취소</button>
      </div>`;
    textEl.classList.add("d-none");
    textEl.insertAdjacentElement("afterend", editor);

    editor.querySelector(".btn-save-edit").addEventListener("click", () => {
      const newText = editor.querySelector("textarea").value.trim();
      if (!newText) return alert("내용을 입력하세요.");
      arr[idx].text = newText;
      arr[idx].updatedAt = new Date().toISOString();
      saveReviews(currentVideo.id, arr);
      renderReviews();
    });
    editor.querySelector(".btn-cancel-edit").addEventListener("click", () => {
      editor.remove();
      textEl.classList.remove("d-none");
    });
  }
});

/* ========================
   검색 결과 카드 렌더 (소유자만 수정/삭제)
======================== */
function renderResults(list) {
  if (!resultCards || !resultCount) return;
  resultCards.innerHTML = "";
  resultCount.textContent = list.length;

  if (list.length === 0) {
    resultCards.innerHTML = `<div class="text-secondary small">조건에 맞는 영상이 없습니다.</div>`;
    return;
  }

  const myEmail = me();
  const loggedIn = isLoggedIn();

  list.forEach((v) => {
    const isMine = loggedIn && v.ownerEmail && v.ownerEmail === myEmail;

    const card = document.createElement("div");
    card.className = "card p-2";
    card.innerHTML = `
      <div class="d-flex gap-2 align-items-start">
        <img src="${getThumb(v)}" alt="${escapeHtml(v.title)}" width="120" height="68"
             class="rounded" style="object-fit:cover;">
        <div class="flex-grow-1">
          <button type="button" class="btn btn-link p-0 text-start w-100 video-card" data-id="${v.id}">
            <div class="fw-semibold text-truncate" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</div>
            <div class="small text-secondary text-truncate">${escapeHtml(v.channelName || "")}</div>
            <div class="mt-1 d-flex gap-1">
              <span class="badge text-bg-light">${v.part || ""}</span>
              <span class="badge text-bg-secondary">${v.duration ?? 0}분</span>
            </div>
          </button>
          <div class="mt-2 d-flex gap-2 justify-content-end">
            ${isMine ? `
              <button class="btn btn-sm btn-outline-secondary edit-video" data-id="${v.id}">
                <i class="bi bi-pencil-square"></i> 수정
              </button>
              <button class="btn btn-sm btn-outline-danger delete-video" data-id="${v.id}">
                <i class="bi bi-trash"></i> 삭제
              </button>` : ``}
          </div>
        </div>
      </div>`;
    resultCards.appendChild(card);
  });
}

/* ========================
   카드 클릭/수정/삭제 이벤트 위임
======================== */
resultCards?.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-video");
  const delBtn  = e.target.closest(".delete-video");
  const playBtn = e.target.closest(".video-card");

  if (editBtn) {
    e.preventDefault();
    openEditModal(editBtn.dataset.id);
    return;
  }
  if (delBtn) {
    e.preventDefault();
    deleteVideoById(delBtn.dataset.id);
    return;
  }
  if (playBtn) {
    const id = playBtn.dataset.id;
    const v  = videos.find(x => x.id === id);
    if (v) renderVideo(v);
  }
});

/* ========================
   필터 적용
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
  if (list.length > 0) renderVideo(list[0]); // 원치 않으면 이 줄 주석
}
$("#filterBtn")?.addEventListener("click", filterVideos);

/* ========================
   수정/삭제 로직
======================== */
function openEditModal(id) {
  if (!isLoggedIn()) return alert("로그인 후 이용해주세요.");
  const myEmail = me();

  const custom = loadCustomVideos();
  const v = custom.find(x => x.id === id && x.ownerEmail === myEmail);
  if (!v) return alert("본인이 추가한 영상만 수정할 수 있습니다.");

  $("#edit-id").value = v.id;
  $("#edit-title").value = v.title;
  $("#edit-url").value = `https://www.youtube.com/watch?v=${getYoutubeId(v) || v.id}`;
  $("#edit-category").value = v.part || "";

  $("#editDeleteBtn").onclick = () => deleteVideoById(id);

  new bootstrap.Modal(document.getElementById("editVideoModal")).show();
}
document.querySelector("#editVideoForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!isLoggedIn()) return alert("로그인 후 이용해주세요.");
  const myEmail = me();

  const id    = $("#edit-id").value;
  const title = $("#edit-title").value.trim();
  const url   = $("#edit-url").value.trim();
  const part  = $("#edit-category").value.trim();

  if (!title || !url || !part) return alert("모든 필드를 입력하세요.");
  const yid = parseYoutubeId(url);
  if (!yid) return alert("유효한 YouTube URL을 입력해주세요.");

  const custom = loadCustomVideos();
  const idx = custom.findIndex(x => x.id === id && x.ownerEmail === myEmail);
  if (idx === -1) return alert("본인이 추가한 영상만 수정할 수 있습니다.");

  custom[idx] = {
    ...custom[idx],
    id: yid,
    title,
    part,
    url: toEmbedUrl(yid),
    updatedAt: new Date().toISOString(),
  };
  saveCustomVideos(custom);

  // 메모리 갱신: 기존 id 제거 → 새 id로 삽입
  const map = new Map(videos.map(v => [v.id, v]));
  map.delete(id);
  map.set(custom[idx].id, custom[idx]);
  videos = Array.from(map.values());

  bootstrap.Modal.getInstance(document.getElementById("editVideoModal"))?.hide();
  filterVideos();
});
function deleteVideoById(id) {
  if (!isLoggedIn()) return alert("로그인 후 이용해주세요.");
  const myEmail = me();
  if (!confirm("이 영상을 삭제하시겠습니까?")) return;

  let custom = loadCustomVideos();
  const before = custom.length;
  custom = custom.filter(x => !(x.id === id && x.ownerEmail === myEmail));
  if (custom.length === before) {
    alert("본인이 추가한 영상만 삭제할 수 있습니다.");
    return;
  }
  saveCustomVideos(custom);

  videos = videos.filter(v => !(v.id === id && v.ownerEmail === myEmail));
  filterVideos();
  bootstrap.Modal.getInstance(document.getElementById("editVideoModal"))?.hide();
}

/* ========================
   사용자 영상 Export (선택)
======================== */
document.getElementById("exportMyVideos")?.addEventListener("click", () => {
  const mine = loadCustomVideos();
  const blob = new Blob([JSON.stringify(mine, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "user-videos.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ========================
   JSON 로드 (기본 + 커스텀 병합)
======================== */
async function loadVideos() {
  try {
    const res = await fetch("../asset/json/video.json"); // pages 기준 경로
    videos = await res.json();

    const custom = loadCustomVideos();
    if (custom.length) {
      const map = new Map(videos.map(v => [v.id, v]));
      custom.forEach(v => map.set(v.id, v));
      videos = Array.from(map.values());
    }

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
