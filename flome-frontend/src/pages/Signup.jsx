import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import axios from '../api/axios';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      // 백엔드 API 호출
      const response = await axios.post('/signup', {
        member_id: formData.email,
        password: formData.password,
        name: formData.name,
        contact: "010-0000-0000", // 전화번호 입력 필드가 없어서 기본값 전송
        type: "USER"
      });

      if (response.status === 200) {
        alert(`${formData.name}님, 회원가입이 완료되었습니다! 로그인해주세요.`);
        navigate('/login'); 
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      const errorMessage = error.response?.data?.detail || "회원가입에 실패했습니다.";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-pink-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="text-gray-500">FloMe와 함께 소중한 마음을 전해보세요</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* 이름 입력 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">이름</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                name="name"
                type="text"
                required
                placeholder="홍길동"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>
          </div>

          {/* 이메일 입력 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                placeholder="example@flome.com"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            가입하기
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-pink-500 font-bold hover:underline">
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;