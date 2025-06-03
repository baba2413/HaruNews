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

// 네이버 뉴스 API 관련 상수
const NAVER_NEWS_API = {
    BASE_URL: 'http://localhost:3000/api/news', // 서버 API 엔드포인트로 변경
    DISPLAY_COUNT: 20 // 뉴스 갯수 (변경가능)
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
    
    // 사용자 정보 표시
    const userAge = document.querySelector('.user-age');
    const userInterests = document.querySelector('.user-interests');
    
    userAge.textContent = `${ageGroup}대`;
    userInterests.textContent = interests.map(interest => {
        const labels = {
            politics: '정치',
            economy: '경제',
            society: '사회',
            sports: '스포츠',
            entertainment: '연예',
            tech: 'IT/과학'
        };
        return labels[interest];
    }).join(', ');
    
    // 선택된 관심사 중 첫 번째를 기본 카테고리로 설정 및 로드
    if (interests.length > 0) {
        const initialCategory = interests[0];
        handleCategoryChange(initialCategory);
    } else {
        // 관심사가 선택되지 않은 경우 기본 카테고리(전체) 로드
        handleCategoryChange('all');
    }
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
    try {
        const response = await fetch(`${NAVER_NEWS_API.BASE_URL}?category=${category}&display=${NAVER_NEWS_API.DISPLAY_COUNT}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // data.items가 없는 경우 처리
        if (!data || !data.items) {
            console.error('뉴스 데이터가 올바르지 않습니다:', data);
            return getDemoNews(category);
        }
        
        // 클라이언트 측 로깅
        console.log('\n=== 클라이언트에서 받은 뉴스 데이터 ===');
        console.log('카테고리:', category);
        console.log('총 뉴스 수:', data.items.length);
        console.log('\n첫 번째 뉴스:');
        console.log(JSON.stringify(data.items[0], null, 2));
        console.log('=====================================\n');
        
        // 뉴스 데이터 가공
        return data.items
            .filter(item => item.link.includes('naver.com')) // naver.com 포함하는 기사만 필터링
            .map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
            description: item.description.replace(/<[^>]*>/g, ''),
            link: item.link,
            publisher: item.publisher,
            publishedAt: formatDate(item.pubDate),
            content: item.description.replace(/<[^>]*>/g, '') // 상세 내용은 description으로 대체
        }));
    } catch (error) {
        console.error('뉴스를 가져오는데 실패했습니다:', error);
        // 데모 데이터 반환
        return getDemoNews(category);
    }
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 데모 뉴스 데이터 (API 키가 없을 때 사용)
function getDemoNews(category) {
    const demoNews = {
        all: [
            {
                title: '주요 뉴스 제목 1',
                description: '주요 뉴스 내용 요약...',
                link: '#',
                publisher: '데모 뉴스',
                publishedAt: '2024년 3월 15일 14:30',
                content: '주요 뉴스 상세 내용...'
            },
            {
                title: '주요 뉴스 제목 2',
                description: '주요 뉴스 내용 요약...',
                link: '#',
                publisher: '데모 뉴스',
                publishedAt: '2024년 3월 15일 13:45',
                content: '주요 뉴스 상세 내용...'
            }
        ],
        politics: [
            {
                title: '정치 뉴스 제목',
                description: '정치 관련 뉴스 내용 요약...',
                link: '#',
                publisher: '데모 뉴스',
                publishedAt: '2024년 3월 15일 15:00',
                content: '정치 뉴스 상세 내용...'
            }
        ],
        economy: [
            {
                title: '경제 뉴스 제목',
                description: '경제 관련 뉴스 내용 요약...',
                link: '#',
                publisher: '데모 뉴스',
                publishedAt: '2024년 3월 15일 14:15',
                content: '경제 뉴스 상세 내용...'
            }
        ]
    };

    return demoNews[category] || demoNews.all;
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
            <span>${news.publishedAt}</span>
        </div>
    `;
    card.addEventListener('click', () => showNewsDetail(news));
    return card;
}

// 뉴스 상세 보기
async function showNewsDetail(news) {
    try {
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
                <div class="news-links">
                    <a href="${news.link}" target="_blank">원문 링크</a>
                </div>
            </div>
            <div class="news-body">
                // <p>${news.description}</p>
                <div class="loading">본문을 불러오는 중...</div>
            </div>
        `;

        // 본문 내용 가져오기
        const response = await fetch(`http://localhost:3000/api/news/content?url=${encodeURIComponent(news.link)}`);
        const result = await response.json();

        if (result.success) {
            const newsBody = content.querySelector('.news-body');
            // <p>${news.description}</p>
            // <div class="full-content">${result.content}</div>

            // 요약을 불러오는 중 로딩 메시지 표시
            newsBody.innerHTML = '<div class="loading">본문 요약을 불러오는 중...</div>';

            try {
                // GPT API로 본문 요약 요청
                const summary = await askGPT('summarize', null, result.content);
                
                // 요약 결과 표시
                newsBody.innerHTML = `
                    <p><strong>GPT 요약:</strong></p>
                    <div class="summary-content">${summary}</div>
                `;

                // 원문 보기 링크 및 전체 본문 추가
                const originalSection = document.createElement('div');
                originalSection.className = 'original-content-section';
                originalSection.innerHTML = `
                    <div class="full-crawled-content" style="display: none;">
                        <h4>원문 전체 내용</h4>
                        <p>${result.content}</p>
                    </div>
                    <button class="toggle-full-content">원문 전체 내용 보기/숨기기</button>
                `;
                newsBody.appendChild(originalSection);

                // 원문 전체 내용 토글 기능 추가
                const toggleButton = originalSection.querySelector('.toggle-full-content');
                const fullContentDiv = originalSection.querySelector('.full-crawled-content');

                toggleButton.addEventListener('click', () => {
                    const isHidden = fullContentDiv.style.display === 'none';
                    fullContentDiv.style.display = isHidden ? 'block' : 'none';
                    toggleButton.textContent = isHidden ? '원문 전체 내용 숨기기' : '원문 전체 내용 보기/숨기기';
                });

            } catch (gptError) {
                console.error('뉴스 본문 요약 실패:', gptError);
                newsBody.innerHTML = `
                    <p>${news.description}</p>
                    <div class="error-message">본문 요약에 실패했습니다. 원문 내용을 확인하세요.</div>
                `;
            }

        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('뉴스 본문을 가져오는데 실패했습니다:', error);
        const newsBody = document.querySelector('.news-body');
        newsBody.innerHTML = `
            <p>${news.description}</p>
            <div class="error-message">본문을 불러오는데 실패했습니다.</div>
        `;
    }
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
        // 사이드바에 로딩 메시지 표시
        showSidebar('GPT 응답을 불러오는 중...');

        const response = await askGPT('qa', question, state.currentNews.content); // 'qa' 타입, 질문, 본문 전달
        showSidebar(response); // GPT 응답을 사이드바에 표시

    } catch (error) {
        console.error('GPT 응답을 받는데 실패했습니다:', error);
        showSidebar('질문에 대한 응답을 받는데 실패했습니다.'); // 에러 메시지 표시
        alert('질문에 대한 응답을 받는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// GPT API 호출
async function askGPT(type, question, text) { // type, question, text 인자 추가
    try {
        const response = await fetch('http://localhost:3000/api/gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                text: text,
                question: question
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.response; // GPT 응답 내용 반환

    } catch (error) {
        console.error('GPT API 호출 실패:', error);
        throw error; // 에러를 다시 던져서 handleGPT에서 잡도록 함
    }
}
//음성질문
const voiceBtn = document.getElementById("voice-chat");

voiceBtn.addEventListener("click", () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;

    recognition.start();

    recognition.onresult = async (event) => {
        const voiceQuestion = event.results[0][0].transcript;
        console.log("음성 질문:", voiceQuestion);

        const summary = document.querySelector('.summary-content')?.innerText;
        if (!summary) {
            alert("요약된 뉴스가 없습니다.");
            return;
        }

        const fullPrompt = `다음은 뉴스 요약입니다:\n${summary}\n\n사용자의 질문:\n${voiceQuestion}\n\n이 뉴스 내용을 바탕으로 질문에 답변해 주세요.`;

        const response = await fetch('/api/ask-gpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt })
        });

        const data = await response.json();
        displayGPTAnswer(data.answer);
    };

    recognition.onerror = (event) => {
        console.error("음성 인식 오류:", event.error);
        alert("음성 인식에 실패했습니다.");
    };
});

function displayGPTAnswer(answer) {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("hidden");
    sidebar.innerHTML = `<p><strong>GPT 응답:</strong></p><div>${answer}</div>`;
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