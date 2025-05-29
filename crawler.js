const fetch = require('node-fetch');
const cheerio = require('cheerio');

// 네이버 뉴스 본문 크롤링 함수
async function crawlNewsContent(url) {
    try {
        // URL 로깅
        console.log('\n=== 크롤링 시작 ===');
        console.log('크롤링 URL:', url);
        
        // 네이버 뉴스 URL인지 확인
        if (!url.includes('naver.com')) {
            console.log(`URL: ${url}\n`)
            throw new Error('Invalid Naver News URL');
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 본문 추출
        let content = '';

        // 네이버 뉴스
        if (!content) {
            // 본문 내용 추출 (메인 페이지)
            content = $('#newsct_article article#dic_area').text()
                .replace(/\s+/g, ' ')
                .trim();
            console.log('메인 페이지 본문 추출:', content.slice(0, 20));
        }

        // 네이버 스포츠 뉴스
        if (!content) {
            content = $('._article_content').text()
                .replace(/\s+/g, ' ')
                .trim();
            console.log('스포츠 뉴스 페이지 본문 추출:', content.slice(0, 20));
        }

        // // 본문이 여전히 없는 경우 대체 방법 시도 (주석 처리 또는 삭제)
        // if (!content) {
        //     content = $('.news_end, .article_body').text()
        //         .replace(/\s+/g, ' ')
        //         .trim();
        // }

        console.log('크롤링 결과:', content ? '성공' : '실패');
        console.log('========================\n');

        return {
            success: true,
            content: content || '본문을 추출할 수 없습니다.',
            url: url
        };

    } catch (error) {
        console.error('뉴스 본문 크롤링 실패:', error);
        return {
            success: false,
            error: error.message,
            url: url
        };
    }
}

module.exports = {
    crawlNewsContent
}; 