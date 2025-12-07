import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Store, MapPin } from 'lucide-react';
import axios from '../api/axios';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isOwner, setIsOwner] = useState(false);
  const [storeData, setStoreData] = useState({
    name: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStoreChange = (e) => {
    setStoreData({ ...storeData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (isOwner && (!storeData.name || !storeData.address)) {
      alert("가게 이름과 주소를 입력해주세요.");
      return;
    }

    try {
      // 1. 회원가입 API 호출
      const response = await axios.post('/signup', {
        member_id: formData.email,
        password: formData.password,
        name: formData.name,
        contact: "010-0000-0000",
        type: isOwner ? "OWNER" : "USER"
      });

      if (response.status === 200) {
        // 2. 점주라면 가게 생성 API 호출
        if (isOwner) {
            try {
                await axios.post('/stores', {
                    owner_id: formData.email, // 방금 가입한 이메일
                    name: storeData.name,
                    address: storeData.address,
                    business_hours: "09:00 - 20:00", // 기본값
                    has_pickup_box: false
                });
            } catch (storeError) {
                console.error("가게 생성 실패:", storeError);
                alert("회원가입은 완료되었으나 가게 생성에 실패했습니다. 관리자에게 문의하세요.");
                navigate('/login');
                return;
            }
        }

        alert(`${formData.name}님, ${isOwner ? '점주 ' : ''}회원가입이 완료되었습니다! 로그인해주세요.`);
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

          {/* 🌟 점주 가입 여부 체크박스 */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input 
                type="checkbox" 
                checked={isOwner}
                onChange={(e) => setIsOwner(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-bold text-blue-800">꽃집 사장님(점주)이신가요?</span>
            </label>
            
            {isOwner && (
              <div className="space-y-3 mt-3 animate-in slide-in-from-top-2 fade-in">
                <div className="relative">
                   <Store className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                   <input
                     name="name"
                     type="text"
                     placeholder="가게 이름 (예: 행복한 꽃집)"
                     value={storeData.name}
                     onChange={handleStoreChange}
                     className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                </div>
                <div className="relative">
                   <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                   <input
                     name="address"
                     type="text"
                     placeholder="가게 주소 (예: 서울시 강남구)"
                     value={storeData.address}
                     onChange={handleStoreChange}
                     className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 ${isOwner ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
          >
            <UserPlus className="w-5 h-5" />
            {isOwner ? '점주로 가입하기' : '가입하기'}
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