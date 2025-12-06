import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. Local Storage에 저장된 회원정보 가져오기
    const storedUser = JSON.parse(localStorage.getItem('registeredUser'));

    // 2. 정보 비교 (가짜 로그인 로직)
    // 테스트용 계정: test@test.com / 1234 도 가능하게 설정
    if (
      (email === 'test@test.com' && password === '1234') || 
      (storedUser && storedUser.email === email && storedUser.password === password)
    ) {
      // 로그인 성공 처리
      const userInfo = storedUser ? storedUser : { name: '테스트유저', email: 'test@test.com' };
      localStorage.setItem('currentUser', JSON.stringify(userInfo)); // 현재 로그인한 사람 저장
      
      alert(`${userInfo.name}님 환영합니다!`);
      navigate('/'); // 메인으로 이동
    } else {
      alert("아이디 또는 비밀번호가 일치하지 않습니다.");
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