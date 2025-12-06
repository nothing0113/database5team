import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Gift, Wallet, Store, ChevronRight, RefreshCw } from 'lucide-react';
import axios from '../api/axios';

const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = localStorage.getItem('currentUser');
    } catch (e) {
      console.error("스토리지 접근 제한:", e);
      alert("브라우저 쿠키/스토리지 설정 문제로 로그인이 풀릴 수 있습니다.");
    }
    
    if (!storedUser) {
      alert("로그인이 필요한 페이지입니다.");
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const fetchMyInfo = async () => {
      try {
        console.log("내 정보 요청 시작:", parsedUser.member_id);

        // 1. 잔액 조회
        const meRes = await axios.get('/me', { 
            params: { member_id: parsedUser.member_id } 
        });
        console.log("잔액 조회 성공:", meRes.data);
        setBalance(meRes.data.money);

        // 2. 주문 내역 조회
        const ordersRes = await axios.get('/orders', {
            params: { member_id: parsedUser.member_id }
        });
        console.log("주문 내역 조회 성공:", ordersRes.data);
        setOrders(ordersRes.data);

      } catch (err) {
        console.error("내 정보 로딩 실패 상세:", err);
        // 에러 내용을 화면에 표시 (디버깅용)
        // alert("정보 로딩 실패: " + (err.response?.data?.detail || err.message));
        
        // 실패 시 기본값 (0원)
        setBalance(0); 
      }
    };

    fetchMyInfo();
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('cart'); 
    } catch (e) {
      console.error(e);
    }
    alert("로그아웃 되었습니다.");
    navigate('/');
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
              <h3 className="text-3xl font-bold text-white tracking-wide">
                {typeof balance === 'number' ? balance.toLocaleString() : "0"}원
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        
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
          
          {orders.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">
               아직 주문 내역이 없어요 🌸
               {/* 디버깅용 메시지: 주문이 진짜 없는 건지, 에러인지 확인 */}
               {/* <br/><span className="text-xs text-red-300">(API 응답: 빈 배열)</span> */}
            </div>
          ) : (
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.order_id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900">{order.store?.name || "가게 정보 없음"}</h4>
                                <span className="text-xs text-gray-500">{new Date(order.order_date).toLocaleString()}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {order.status === 'PAID' ? '결제완료' : order.status}
                            </span>
                        </div>
                        <div className="space-y-1 mb-3">
                            {order.items.map((item) => (
                                <div key={item.item_id} className="flex justify-between text-sm text-gray-600">
                                    <span>- {item.product?.name || "상품명 없음"}</span>
                                    <span>x {item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 pt-2 flex justify-end">
                            <span className="font-bold text-gray-900">
                                총 {order.items.reduce((sum, item) => sum + (item.snapshot_price * item.quantity), 0).toLocaleString()}원
                            </span>
                        </div>
                    </div>
                ))}
            </div>
          )}
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