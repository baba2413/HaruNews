require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { crawlNewsContent } = require('./crawler');
const OpenAI = require('openai');
const openai = new OpenAI();

// // 사용 가능한 모델 목록 출력
// async function listModels() {
//     try {
//         console.log('=== 사용 가능한 OpenAI 모델 목록 ===');
//         const models = await openai.models.list();
//         for await (const model of models) {
//             console.log(model.id);
//         }
//         console.log('==============================');
//     } catch (error) {
//         console.error('OpenAI 모델 목록 가져오기 실패:', error);
//     }
// }
// listModels(); // 서버 시작 시 함수 호출

const app = express();
const port = 3000;

// // 환경 변수 검증
// if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
//     console.error('Error: NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set in .env file');
//     process.exit(1);
// }

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 네이버 뉴스 API 프록시 엔드포인트
app.get('/api/news', async (req, res) => {
    try {
        const { category, display } = req.query;
        const categoryKeywords = {
            all: '시사',
            politics: '정치',
            economy: '경제',
            society: '사회',
            sports: '스포츠',
            entertainment: '연예',
            tech: 'IT 과학'
        };

        const keyword = categoryKeywords[category] || '';
        const query = encodeURIComponent(keyword);
        
        const response = await fetch(
            `https://openapi.naver.com/v1/search/news.json?query=${query}&display=${display}`,
            {
                headers: {
                    'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
                }
            }
        );

        const data = await response.json();
        
        // // API 응답 데이터 로깅
        // console.log('\n=== 네이버 뉴스 API 응답 ===');
        // console.log('검색어:', keyword);
        // console.log('총 검색 결과:', data.total);
        // console.log('\n첫 번째 뉴스 항목:');
        // console.log(JSON.stringify(data.items[0], null, 2));
        // console.log('========================\n');

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// 뉴스 본문 크롤링 엔드포인트
app.get('/api/news/content', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const result = await crawlNewsContent(url);
        
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to crawl news content' });
    }
});

// GPT API 엔드포인트
app.post('/api/gpt', async (req, res) => {
    try {
        const { type, text, question } = req.body;

        if (!text) {
            return res.status(400).json({ error: '뉴스 본문 내용이 필요합니다.' });
        }

        let prompt = '';
        if (type === 'summarize') {
            prompt = `다음 뉴스 기사에 대한 한국어 큐레이션을 작성해 주세요. 이것은 기사에 친숙하지 않은 사람들을 위한 것임을 고려해서 작성해주세요.:\n\n${text}`;
        } else if (type === 'qa' && question) {
            // prompt = `뉴스 기사 내용:\n\n${text}\n\n위 기사 내용을 바탕으로 다음 질문에 답변해줘:\n\n질문: ${question}\n\n답변:`;
            prompt = `요청의 내용이 질문 형식이라면 질문에 대답한다.\n요청의 내용이 단어 형태라면 단어에 대한 개념을 설명한다.\n모두 아니라면 요령껏 대답한다.\n\n요청: ${question}`;
            console.log(prompt);
        } else {
            return res.status(400).json({ error: '유효한 요청 타입 (summarize 또는 qa)과 질문 (qa 타입 시)이 필요합니다.' });
        }

        const chatCompletion = await openai.chat.completions.create({
            messages: [{
                role: 'user',
                content: prompt
            }],
            model: 'gpt-4o-mini', // 또는 'gpt-3.5-turbo', 'gpt-4' 등 사용 가능한 모델 지정
        });

        const gptResponse = chatCompletion.choices[0].message.content;

        res.json({ success: true, response: gptResponse });

    } catch (error) {
        console.error('GPT API 호출 실패:', error);
        res.status(500).json({ error: 'GPT API 호출 중 오류가 발생했습니다.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 