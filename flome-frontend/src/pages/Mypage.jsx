import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Gift, Wallet, Store, ChevronRight, RefreshCw, Star, X, Edit3, CheckCircle } from 'lucide-react';
import axios from '../api/axios';

const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState([]);
  
  // 리뷰 모달 상태
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    orderId: null,
    rating: 5,
    content: ''
  });

  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = localStorage.getItem('currentUser');
    } catch (e) {
      console.error("스토리지 접근 제한:", e);
    }
    
    if (!storedUser) {
      alert("로그인이 필요한 페이지입니다.");
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchMyInfo(parsedUser.member_id);
  }, [navigate]);

  const fetchMyInfo = async (memberId) => {
    try {
      // 1. 잔액 조회
      const meRes = await axios.get('/me', { params: { member_id: memberId } });
      setBalance(meRes.data.money);

      // 2. 주문 내역 조회
      const ordersRes = await axios.get('/orders', { params: { member_id: memberId } });
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("정보 로딩 실패:", err);
      setBalance(0); 
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('cart'); 
    } catch (e) { console.error(e); }
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  const openReviewModal = (orderId) => {
    setReviewData({ orderId, rating: 5, content: '' });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewData.content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      await axios.post('/reviews', {
        rating: reviewData.rating,
        content: reviewData.content,
        writer_id: user.member_id,
        order_id: reviewData.orderId
      });
      
      alert("리뷰가 등록되었습니다! 🌸");
      setIsReviewModalOpen(false);
      // 주문 목록 갱신 (리뷰 작성 여부 반영 등 필요한 경우)
      fetchMyInfo(user.member_id);
    } catch (error) {
      console.error("리뷰 등록 실패:", error);
      const msg = error.response?.data?.detail || "리뷰 등록 실패";
      alert(msg);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 pb-20 relative">
      
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
            <div className="py-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">아직 주문 내역이 없어요 🌸</div>
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
                        <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                            <div className="flex gap-2">
                                {/* 수령 완료 버튼 (PREPARING 또는 PAID 상태일 때 시연용) */}
                                {(order.status === 'PREPARING' || order.status === 'PAID') && (
                                    <button 
                                      onClick={async () => {
                                          if(window.confirm("상품을 수령하셨나요?")) {
                                              try {
                                                  await axios.put(`/orders/${order.order_id}/status`, { status: 'PICKED_UP' });
                                                  alert("수령 확인되었습니다! 리뷰를 작성해주세요.");
                                                  window.location.reload(); // 확실한 UI 갱신을 위해 새로고침
                                              } catch(e) { 
                                                  console.error(e);
                                                  alert("오류 발생"); 
                                              }
                                          }
                                      }}
                                      className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 flex items-center gap-1"
                                    >
                                      <CheckCircle className="w-3 h-3" /> 수령 완료
                                    </button>
                                )}

                                {/* 리뷰 작성 버튼 (픽업 완료 시) */}
                                {(order.status === 'PICKED_UP' || order.status === '완료') && (
                                    <button 
                                      onClick={() => openReviewModal(order.order_id)}
                                      className="text-xs bg-pink-100 text-pink-600 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-200 flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> 리뷰 쓰기
                                    </button>
                                )}
                            </div>
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
        <button onClick={handleLogout} className="w-full bg-white p-4 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 font-bold transition flex items-center justify-center gap-2 shadow-sm border border-gray-100">
          <LogOut className="w-5 h-5" /> 로그아웃
        </button>
      </div>

      {/* 🌟 리뷰 작성 모달 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">리뷰 작성</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewData({...reviewData, rating: star})}>
                    <Star className={`w-8 h-8 ${star <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[100px]"
                placeholder="꽃은 어떠셨나요? 솔직한 리뷰를 남겨주세요."
                value={reviewData.content}
                onChange={(e) => setReviewData({...reviewData, content: e.target.value})}
              />
              <button onClick={handleSubmitReview} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl">
                리뷰 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPage;