// API 키 설정
const API_KEYS = {
    NAVER_CLIENT_ID: 'YOUR_NAVER_CLIENT_ID',
    NAVER_CLIENT_SECRET: 'YOUR_NAVER_CLIENT_SECRET',
    OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY'
};

// 상태 관리
const state = {
    userPreferences: {
        ageGroup: null,
        interests: []
    },
    currentCategory: 'all',
    currentNews: null
};

// DOM 요소
const elements = {
    setupScreen: document.getElementById('setup-screen'),
    mainScreen: document.getElementById('main-screen'),
    detailScreen: document.getElementById('detail-screen'),
    startBtn: document.getElementById('start-btn'),
    ageGroup: document.getElementById('age-group'),
    interestCheckboxes: document.querySelectorAll('.interest-tags input'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    newsContainer: document.getElementById('news-container'),
    backBtn: document.getElementById('back-btn'),
    ttsBtn: document.getElementById('tts-btn'),
    gptBtn: document.getElementById('gpt-btn'),
    sidebar: document.getElementById('sidebar')
};

// 이벤트 리스너 설정
function setupEventListeners() {
    // 시작하기 버튼
    elements.startBtn.addEventListener('click', handleStart);

    // 카테고리 버튼들
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => handleCategoryChange(btn.dataset.category));
    });

    // 뒤로가기 버튼
    elements.backBtn.addEventListener('click', () => {
        elements.detailScreen.classList.add('hidden');
        elements.mainScreen.classList.remove('hidden');
    });

    // TTS 버튼
    elements.ttsBtn.addEventListener('click', handleTTS);

    // GPT 버튼
    elements.gptBtn.addEventListener('click', handleGPT);
}

// 시작하기 처리
function handleStart() {
    const ageGroup = elements.ageGroup.value;
    const interests = Array.from(elements.interestCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    if (interests.length === 0) {
        alert('최소 하나 이상의 관심사를 선택해주세요.');
        return;
    }

    state.userPreferences = { ageGroup, interests };
    elements.setupScreen.classList.add('hidden');
    elements.mainScreen.classList.remove('hidden');
    loadNews();
}

// 카테고리 변경 처리
function handleCategoryChange(category) {
    state.currentCategory = category;
    elements.categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    loadNews();
}

// 뉴스 로드
async function loadNews() {
    try {
        const news = await fetchNews(state.currentCategory);
        displayNews(news);
    } catch (error) {
        console.error('뉴스를 불러오는데 실패했습니다:', error);
        alert('뉴스를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 네이버 뉴스 API 호출
async function fetchNews(category) {
    // TODO: 네이버 뉴스 API 구현
    return [];
}

// 뉴스 표시
function displayNews(news) {
    elements.newsContainer.innerHTML = '';
    news.forEach(item => {
        const card = createNewsCard(item);
        elements.newsContainer.appendChild(card);
    });
}

// 뉴스 카드 생성
function createNewsCard(news) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
        <h3>${news.title}</h3>
        <p>${news.description}</p>
        <div class="news-meta">
            <span>${news.publisher}</span>
            <span>${news.publishedAt}</span>
        </div>
    `;
    card.addEventListener('click', () => showNewsDetail(news));
    return card;
}

// 뉴스 상세 보기
function showNewsDetail(news) {
    state.currentNews = news;
    elements.mainScreen.classList.add('hidden');
    elements.detailScreen.classList.remove('hidden');
    elements.sidebar.classList.add('hidden');
    
    const content = document.querySelector('.news-content');
    content.innerHTML = `
        <h2>${news.title}</h2>
        <div class="news-meta">
            <span>${news.publisher}</span>
            <span>${news.publishedAt}</span>
        </div>
        <div class="news-body">${news.content}</div>
    `;
}

// TTS 처리
function handleTTS() {
    if (!state.currentNews) return;
    
    const text = state.currentNews.content;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    speechSynthesis.speak(utterance);
}

// GPT 질문 처리
async function handleGPT() {
    if (!state.currentNews) return;
    
    const question = prompt('뉴스에 대해 궁금한 점을 입력해주세요:');
    if (!question) return;

    try {
        const response = await askGPT(question, state.currentNews);
        showSidebar(response);
    } catch (error) {
        console.error('GPT 응답을 받는데 실패했습니다:', error);
        alert('질문에 대한 응답을 받는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// GPT API 호출
async function askGPT(question, news) {
    // TODO: OpenAI API 구현
    return 'GPT 응답 예시';
}

// 사이드바 표시
function showSidebar(content) {
    elements.sidebar.classList.remove('hidden');
    elements.sidebar.innerHTML = content;
}

// 초기화
function init() {
    setupEventListeners();
}

// 앱 시작
init(); 