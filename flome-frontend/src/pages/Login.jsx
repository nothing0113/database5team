import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import axios from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/login', {
        email: email,
        password: password
      });

      // 로그인 성공 처리
      // 백엔드에서 받은 Member 정보를 그대로 저장
      localStorage.setItem('currentUser', JSON.stringify(response.data)); 
      
      alert(`${response.data.name}님 환영합니다!`);
      navigate('/'); // 메인으로 이동
    } catch (error) {
      console.error("로그인 에러:", error);
      const errorMessage = error.response?.data?.detail || "아이디 또는 비밀번호가 일치하지 않습니다.";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-pink-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">로그인</h2>
          <p className="text-gray-500">FloMe에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                placeholder="example@flome.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            로그인
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="text-pink-500 font-bold hover:underline">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;