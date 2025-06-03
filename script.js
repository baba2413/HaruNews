// 상태 관리
const state = {
    userPreferences: {
        ageGroup: null,
        interests: []
    },
    currentCategory: 'all',
    currentNews: null,
    currentAudio: null  // 현재 재생 중인 오디오 객체 저장
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
    sidebar: document.getElementById('sidebar'),
    darkToggle: document.getElementById('darkmode-toggle'), 
    darkIcon: document.getElementById('darkmode-icon'),
    logos: document.querySelectorAll('.logo-container h1')   // 모든 로고 요소 선택
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

    // 로고 클릭 이벤트 (모든 로고에 적용)
    elements.logos.forEach(logo => {
        logo.addEventListener('click', () => {
            // 현재 재생 중인 오디오가 있다면 중지
            if (state.currentAudio) {
                state.currentAudio.pause();
                state.currentAudio = null;
                elements.ttsBtn.textContent = '🔊 TTS';
            }
            
            // 모든 화면 숨기기
            elements.mainScreen.classList.add('hidden');
            elements.detailScreen.classList.add('hidden');
            elements.sidebar.classList.add('hidden');
            
            // 설정 화면 표시
            elements.setupScreen.classList.remove('hidden');
        });
    });

    // 카테고리 버튼들
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => handleCategoryChange(btn.dataset.category));
    });

    // 뒤로가기 버튼
    elements.backBtn.addEventListener('click', () => {
        const existing = document.querySelector('.gpt-response');
        if (existing) existing.remove();
        elements.detailScreen.classList.add('hidden');
        elements.mainScreen.classList.remove('hidden');
    });

    // TTS 버튼
    elements.ttsBtn.addEventListener('click', handleTTS);

    // GPT 버튼
    elements.gptBtn.addEventListener('click', handleGPT);

    // 다크 모드 토글
    elements.darkToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', elements.darkToggle.checked);
        elements.darkIcon.textContent = elements.darkToggle.checked ? '🔆' : '🌙';
        elements.darkIcon.style.transform = elements.darkToggle.checked ? 'translateY(1px)' : 'translateY(0)'
    });
}

// 시작하기 처리
function handleStart() {
    const ageGroup = elements.ageGroup.value;
    const selectedInterest = document.querySelector('input[name="interest"]:checked');

    if (!selectedInterest) {
        alert('관심사를 선택해주세요.');
        return;
    }

    state.userPreferences = { 
        ageGroup, 
        interests: [selectedInterest.value] 
    };
    
    elements.setupScreen.classList.add('hidden');
    elements.mainScreen.classList.remove('hidden');
    
    // // 사용자 정보 표시
    // const userAge = document.querySelector('.user-age');
    // const userInterests = document.querySelector('.user-interests');
    
    // userAge.textContent = `${ageGroup}대`;
    // userInterests.textContent = interests.map(interest => {
    //     const labels = {
    //         politics: '정치',
    //         economy: '경제',
    //         society: '사회',
    //         sports: '스포츠',
    //         entertainment: '연예',
    //         tech: 'IT/과학',
    //         location: '위치기반'
    //     };
    //     return labels[interest];
    // }).join(', ');

    // 선택된 관심사를 기본 카테고리로 설정 및 로드
    handleCategoryChange(selectedInterest.value);
}

// 카테고리 변경 처리
async function handleCategoryChange(category) {
    state.currentCategory = category;
    elements.categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    if (category === 'recommend') {
        try {
            const news = await fetchNews('all');
            const sortedNews = sortNewsByReadSimilarity(news);

            // 디버깅용 파트: 헤드라인, 유사도 출력
            const top3 = sortedNews.slice(0, );
            top3.forEach(item => {
                const readList = getReadHeadlines();
                let maxSim = 0;
                readList.forEach(readTitle => {
                    const sim = jaccardSimilarity(readTitle, item.title);
                    if (sim > maxSim) maxSim = sim;
                });
                console.log(`헤드라인: ${item.title} 유사도: ${maxSim.toFixed(2)}`);
            });

            displayNews(sortedNews);
        } catch (error) {
            console.error('추천 뉴스 로드 실패:', error);
            alert('추천 뉴스를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
    } else if (category === 'location') {
        loadLocationNews(); // 위치기반 로직 분리
    } else {
        loadNews();
    }
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
            publisher: new URL(item.originallink || item.link).hostname.replace('www.', ''),
            publishedAt: formatDate(item.pubDate),
            content: item.description.replace(/<[^>]*>/g, '') // 상세 내용은 description으로 대체
        }));
    } catch (error) {
        console.error('뉴스를 가져오는 데 실패했습니다:', error);
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
    // 세션 저장소에 헤드라인 저장
    card.addEventListener('click', () => {
        saveReadHeadline(news.title);
        showAllReadHeadlinesToConsole();
        showNewsDetail(news);
    });
    return card;
}

// 세션 저장소에 저장된 모든 기사 헤드라인을 콘솔에 출력
function showAllReadHeadlinesToConsole() {
    const arr = getReadHeadlines();
    console.log('--- 현재 세션에 저장된 읽은 기사 헤드라인 ---');
    arr.forEach((headline, idx) => {
        console.log(`${idx + 1}. ${headline}`);
    });
    console.log('-----------------------------------------');
}

// 세션저장소에서 readHeadlines 배열 추출
function getReadHeadlines() {
    const stored = sessionStorage.getItem('readHeadlines');
    try {
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// 세션 저장소에 읽은 기사 헤드라인 저장
function saveReadHeadline(title) {
    const arr = getReadHeadlines();
    // 중복 저장 방지
    if (!arr.includes(title)) {
        arr.push(title);
        sessionStorage.setItem('readHeadlines', JSON.stringify(arr));
    }
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
            <h2 style="margin-top: 16px;">${news.title}</h2>
            <p class="news-meta">
                ${news.publishedAt}
                <a class="original-link" href="${news.link}" target="_blank">원문 링크</a>
                <br>
                ${news.publisher}
            </p>
            <div class="news-body">
                <div class="loading-message">본문을 불러오는 중...</div>
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
            newsBody.innerHTML = '<div class="loading-message">본문 요약을 불러오는 중...</div>';

            try {
                // GPT API로 본문 요약 요청
                const summary = await askGPT('summarize', null, result.content);

                state.currentNews.summary = summary;
                
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
                        <h4>원문 내용</h4>
                        <p>${result.content}</p>
                    </div>
                    <button>원문 보기</button>
                `;

                const summaryContent = content.querySelector('.summary-content');
                if (summaryContent) summaryContent.style.marginBottom = '24px';
                newsBody.appendChild(originalSection);

                // 원문 전체 내용 토글 기능 추가
                const toggleButton = originalSection.querySelector('button');
                const fullContentDiv = originalSection.querySelector('.full-crawled-content');

                toggleButton.addEventListener('click', () => {
                    const isHidden = fullContentDiv.style.display === 'none';
                    fullContentDiv.style.display = isHidden ? 'block' : 'none';
                    toggleButton.textContent = isHidden ? '원문 숨기기' : '원문 보기';
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


async function getCityNameFromCoords(lat, lng) {
    try {
        const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        const data = await response.json();

        if (data.success && data.address) {
            return data.address.split(' ').find(part => part.endsWith('시') || part.endsWith('군')) || data.address;

        } else {
            return null;
        }
    } catch (error) {
        console.error('주소 변환 실패:', error);
        return null;
    }
}


function getCurrentCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('위치정보를 지원하지 않습니다.'));
        } else {
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => reject(err)
            );
        }
    });
}


async function loadLocationNews() {
    try {
        // 로딩 상태 표시
        elements.newsContainer.innerHTML = '<div class="loading-message">위치 기반 뉴스를 불러오는 중...</div>';
        
        const coords = await getCurrentCoordinates(); // GPS
        const city = await getCityNameFromCoords(coords.lat, coords.lng); // 주소 변환
        console.log(`city:${city}\n`)
        if (!city) throw new Error('도시명 추출 실패');

        const news = await fetchNews(city); // 기존 함수 사용
        displayNews(news);
    } catch (err) {
        console.error('위치기반 뉴스 실패:', err);
        elements.newsContainer.innerHTML = '<div class="error-message">위치 기반 뉴스를 불러오는 데 실패했습니다.</div>';
    }
}


function getBrightnessByTime() {
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}


// TTS 처리
async function handleTTS() {
    if (!state.currentNews) return;

    // 이미 재생 중인 오디오가 있다면 중지
    if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
        elements.ttsBtn.textContent = '🔊 TTS';
        elements.ttsBtn.classList.remove('loading');
        return;
    }

    const brightness = getBrightnessByTime();
    const text = state.currentNews.summary || state.currentNews.description;

    if (!text) {
        alert('읽을 텍스트가 없습니다.');
        return;
    }

    try {
        // TTS 생성 중 상태 표시
        elements.ttsBtn.textContent = '⏳ 준비 중...';
        elements.ttsBtn.classList.add('loading');
        elements.ttsBtn.disabled = true;

        const response = await fetch('http://localhost:3000/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, brightness })
        });

        const data = await response.json();

        console.log('[🔊 TTS 응답]', data);

        if (!data.success) {
            throw new Error(data.error || 'TTS 처리 실패');
        }

        if (!data.audioContent || typeof data.audioContent !== 'string') {
            throw new Error('audioContent 형식이 잘못되었거나 비어있음');
        }

        // Base64 → Audio 객체 재생
        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);
        
        // 오디오 재생이 끝나면 상태 초기화
        audio.onended = () => {
            state.currentAudio = null;
            elements.ttsBtn.textContent = '🔊 TTS';
            elements.ttsBtn.classList.remove('loading');
            elements.ttsBtn.disabled = false;
        };

        // 오디오 재생 중 에러 발생 시 상태 초기화
        audio.onerror = () => {
            state.currentAudio = null;
            elements.ttsBtn.textContent = '🔊 TTS';
            elements.ttsBtn.classList.remove('loading');
            elements.ttsBtn.disabled = false;
            alert('음성 재생에 실패했습니다.');
        };

        state.currentAudio = audio;  // 현재 재생 중인 오디오 저장
        elements.ttsBtn.textContent = '⏹️ 중지';  // 버튼 텍스트 변경
        elements.ttsBtn.classList.remove('loading');
        elements.ttsBtn.disabled = false;
        audio.play().catch(err => {
            console.error('오디오 재생 오류:', err);
            alert('음성 재생에 실패했습니다.');
            state.currentAudio = null;
            elements.ttsBtn.textContent = '🔊 TTS';
            elements.ttsBtn.classList.remove('loading');
            elements.ttsBtn.disabled = false;
        });

    } catch (error) {
        console.error('TTS 처리 중 오류:', error);
        alert('음성을 생성하는 데 실패했습니다.');
        state.currentAudio = null;
        elements.ttsBtn.textContent = '🔊 TTS';
        elements.ttsBtn.classList.remove('loading');
        elements.ttsBtn.disabled = false;
    }
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

    // 음성 인식 시작 시 버튼 상태 변경
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '🎤 듣는 중...';
    voiceBtn.disabled = true;

    recognition.start();

    recognition.onresult = async (event) => {
        const voiceQuestion = event.results[0][0].transcript;
        console.log("음성 질문:", voiceQuestion);

        // 음성 인식 완료 후 버튼 상태 복구
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '🎤 음성 질문';
        voiceBtn.disabled = false;

        const summary = document.querySelector('.summary-content')?.innerText;
        if (!summary) {
            alert("요약된 뉴스가 없습니다.");
            return;
        }

        // // 뉴스 관련 질문하라고 답변 안 할 때가 있음
        // const fullPrompt = `다음은 뉴스 요약입니다:\n${summary}\n\n사용자의 질문:\n${voiceQuestion}\n\n이 뉴스 내용을 바탕으로 질문에 답변해 주세요.`;
        const fullPrompt = `요청의 내용이 질문 형식이라면 질문에 대답한다.\n요청의 내용이 단어 형태라면 단어에 대한 개념을 설명한다.\n모두 아니라면 요령껏 대답한다.\n\n요청: ${voiceQuestion}`;

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
        // 에러 발생 시에도 버튼 상태 복구
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '🎤 음성 질문';
        voiceBtn.disabled = false;
    };

    recognition.onend = () => {
        // 음성 인식이 종료될 때 버튼 상태 복구
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '🎤 음성 질문';
        voiceBtn.disabled = false;
    };
});

function displayGPTAnswer(answer) {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("hidden");
    sidebar.innerHTML = `<p><strong>GPT 응답:</strong></p><div>${answer}</div>`;
}



// 헤드라인 텍스트 cleaning
function makeWordSet(text) {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s]/gi, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0)
    );
}

// 유사도 계산
function jaccardSimilarity(a, b) {
    const setA = makeWordSet(a);
    const setB = makeWordSet(b);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionSize = 0;
    setA.forEach(word => {
        if (setB.has(word)) intersectionSize++;
    });

    const unionSize = new Set([...setA, ...setB]).size;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// 헤드라인 간 유사도 비교
function sortNewsByReadSimilarity(newsItems) {
    const readList = getReadHeadlines();
    if (readList.length === 0) {
        return newsItems;
    }

    const withScore = newsItems.map(item => {
        let maxSim = 0;
        readList.forEach(readTitle => {
            const sim = jaccardSimilarity(readTitle, item.title);
            if (sim > maxSim) maxSim = sim;
        });
        return { item, score: maxSim };
    });

    withScore.sort((a, b) => b.score - a.score);
    return withScore.map(obj => obj.item);
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
