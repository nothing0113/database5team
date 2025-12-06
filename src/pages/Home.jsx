import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, ShoppingBag } from 'lucide-react';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setIsLoggedIn(true);
      setUserName(JSON.parse(user).name);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 히어로 섹션 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-b from-pink-50 to-white">
        <div className="bg-pink-100 p-4 rounded-full mb-4 animate-bounce">
          <Sparkles className="w-10 h-10 text-pink-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          소중한 마음,<br/>
          <span className="text-pink-500">AI가 꽃으로</span> 전해드려요
        </h1>
        
        <p className="text-gray-500 text-lg">
          {isLoggedIn 
            ? `${userName}님, 오늘 누구에게 마음을 전할까요?` 
            : "로그인하고 AI에게 딱 맞는 꽃을 추천받아보세요."}
        </p>

        {/* 버튼 영역 (위아래 배치) */}
        <div className="w-full pt-8 flex flex-col gap-3">
          
          {/* 1. 메인 버튼 (로그인 여부에 따라 다름) */}
          {isLoggedIn ? (
            <Link 
              to="/chat" 
              className="block w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              꽃 추천받기 <ArrowRight />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="block w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              로그인하고 시작하기 <LogIn />
            </Link>
          )}

          {/* 2. 서브 버튼 (상품 구경하기 - 항상 보임) */}
          <Link 
            to="/products" 
            className="block w-full bg-white border-2 border-pink-100 hover:border-pink-300 text-pink-500 font-bold py-4 rounded-xl text-lg shadow-sm transition flex items-center justify-center gap-2"
          >
            전체 꽃 상품 구경하기 <ShoppingBag className="w-5 h-5" />
          </Link>
          
        </div>
      </div>

      {/* 특징 소개 */}
      <div className="p-8 bg-white">
        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Service Features</h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500">🤖</div>
            <div>
              <h4 className="font-bold">상황 맞춤형 추천</h4>
              <p className="text-sm text-gray-500">사연을 듣고 가장 어울리는 꽃말을 가진 꽃을 골라줍니다.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-green-50 p-3 rounded-lg text-green-500">📍</div>
            <div>
              <h4 className="font-bold">실시간 재고 매칭</h4>
              <p className="text-sm text-gray-500">내 주변 1km 이내, 지금 바로 살 수 있는 꽃집만 연결합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;