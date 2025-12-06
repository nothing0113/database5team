import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Gift, Wallet, Store, ChevronRight, RefreshCw } from 'lucide-react';

const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      alert("로그인이 필요한 페이지입니다.");
      navigate('/login');
      return;
    }

    const storedBalance = localStorage.getItem('userBalance');
    if (storedBalance !== null) {
      setBalance(Number(storedBalance));
    } else {
      localStorage.setItem('userBalance', '100000');
      setBalance(100000);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    alert("로그아웃 되었습니다.");
    navigate('/');
    window.location.reload(); 
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 pb-20">
      
      {/* 프로필 영역 */}
      <div className="bg-white p-6 pb-8 rounded-b-[2rem] shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}님</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* FloMe Pay */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-white" />
                <span className="font-bold text-white">FloMe Pay</span>
              </div>
              <span className="bg-white/20 px-2 py-1 rounded text-xs text-white">안심결제</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-pink-100 font-medium">보유 잔액</p>
              <h3 className="text-3xl font-bold text-white tracking-wide">{balance.toLocaleString()}원</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        
        {/* 🌟 [핵심] 관리자 모드 전환 버튼 */}
        <button 
          onClick={() => navigate('/admin')}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-between group hover:bg-blue-700 transition transform hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">점주 모드로 전환</p>
              <p className="text-xs text-blue-100 opacity-80">내 가게 매출/재고 관리하기</p>
            </div>
          </div>
          <div className="bg-white/20 p-1.5 rounded-full">
            <RefreshCw className="w-5 h-5" />
          </div>
        </button>

        {/* 주문 내역 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            최근 주문 내역
          </h3>
          <div className="py-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">
             아직 주문 내역이 없어요 🌸
          </div>
        </div>

        {/* 로그아웃 */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white p-4 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 font-bold transition flex items-center justify-center gap-2 shadow-sm border border-gray-100"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default MyPage;