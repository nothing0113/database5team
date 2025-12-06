import axios from 'axios';

// 백엔드 도커 서버 주소 (기본값 8000)
const instance = axios.create({
  baseURL: 'http://localhost:8000', 
  // 만약 백엔드 주소가 다르다면 위 주소를 수정하세요 (예: http://localhost:8080)
});

export default instance;