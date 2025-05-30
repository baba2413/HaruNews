# HaruNews (하루뉴스)

하루 5분, 간단하게 뉴스를 볼 수 있는 웹 프로젝트입니다.

## 주요 기능

- 연령대와 관심사 기반 뉴스 추천
- 카테고리별 뉴스 카드 형식 제공
- 뉴스 상세 보기
  - TTS를 통한 음성 재생
  - 용어 위키피디아 검색
  - GPT를 통한 질의응답

## 사용된 API

- 네이버 뉴스 API
- OpenAI API
- 위키피디아 API

## 기술 스택

- HTML
- JavaScript
- CSS

## 시작하기

1. 프로젝트 클론
2. `.env` 파일 생성 및 API 키 설정
   ```
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here

   # Naver API Keys
   NAVER_CLIENT_ID=your_naver_client_id_here
   NAVER_CLIENT_SECRET=your_naver_client_secret_here
   ```
3. `npm install` 실행하여 의존성 설치
4. `npm start` 실행하여 서버 시작
5. localhost 접속

## 주의사항

- API 키가 필요합니다 (네이버 뉴스 API, OpenAI API)
- API 키는 `.env` 파일에 설정해야 합니다
- `.env` 파일은 절대로 git에 커밋하지 마세요 
