import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, Clock, Truck, Package, Store } from 'lucide-react';
import axios from '../api/axios';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [myBalance, setMyBalance] = useState(0); 
  
  // 수령 방법 및 시간 상태
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // pickup | delivery | box
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm

  useEffect(() => {
    // ... (기존 로직 동일)
    // 장바구니 불러오기
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    // 로그인 정보 및 잔액 불러오기
    const fetchUserInfo = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        try {
          const response = await axios.get('/me', { 
            params: { member_id: user.member_id } 
          });
          setMyBalance(response.data.money);
        } catch (err) {
          setMyBalance(user.money || 0);
        }
      }
    };
    
    fetchUserInfo();
  }, []);

  const totalPrice = cartItems.reduce((acc, item) => acc + (parseInt(item.price) || 0), 0);
  const finalPrice = totalPrice; // 배달팁 로직은 생략

  const removeItem = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // 🌟 실제 주문 API 호출
  const handlePayment = async () => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
        alert("로그인이 필요합니다!");
        navigate('/login');
        return;
    }

    if (myBalance < finalPrice) {
        alert(`잔액이 부족합니다! 😱\n현재 잔액: ${myBalance.toLocaleString()}원`);
        return;
    }

    const targetStoreId = cartItems[0].storeId;
    const targetItems = cartItems.filter(item => item.storeId === targetStoreId);
    
    // 수량 집계
    const itemsMap = {};
    targetItems.forEach(item => {
        if (itemsMap[item.id]) itemsMap[item.id] += 1;
        else itemsMap[item.id] = 1;
    });

    const orderItems = Object.keys(itemsMap).map(productId => ({
        product_id: productId,
        quantity: itemsMap[productId]
    }));

    // 배달 요청사항 문자열 생성
    let requestStr = "";
    if (deliveryMethod === 'pickup') requestStr = `매장 픽업 / ${reservationDate.replace('T', ' ')}`;
    else if (deliveryMethod === 'delivery') requestStr = "바로 배달 요청";
    else if (deliveryMethod === 'box') requestStr = `무인 픽업함 / ${reservationDate.replace('T', ' ')}`;

    try {
        // AI 데이터 확인
        const pendingAiDataStr = localStorage.getItem('pending_ai_data');
        let aiPayload = {};
        if (pendingAiDataStr) {
            aiPayload = JSON.parse(pendingAiDataStr);
        }

        const response = await axios.post('/orders', {
            store_id: targetStoreId,
            member_id: currentUser.member_id,
            items: orderItems,
            delivery_request: requestStr, // 요청사항 추가
            ...aiPayload 
        });

        if (response.status === 200) {
            alert(`주문이 완료되었습니다! 🌸\n수령 방법: ${requestStr}`);
            clearCart();
            localStorage.removeItem('pending_ai_data');
            navigate('/mypage'); // 주문 내역 확인을 위해 마이페이지로 이동
        }
    } catch (error) {
        console.error("주문 실패:", error);
        const msg = error.response?.data?.detail || "주문에 실패했습니다.";
        alert("주문 실패: " + msg);
    }
  };

  if (cartItems.length === 0) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
          <div className="text-6xl">🛒</div>
          <p className="text-gray-500 font-bold">장바구니가 비어있어요</p>
          <button onClick={() => navigate('/products')} className="bg-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-600 transition">꽃 담으러 가기</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white sticky top-0 z-50 px-4 h-14 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
        <h1 className="text-lg font-bold text-gray-900">장바구니</h1>
        <button onClick={clearCart} className="text-xs text-gray-500 hover:text-red-500">전체삭제</button>
      </div>

      <div className="p-4 space-y-4">
        {/* 잔액 표시 */}
        <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-bold text-sm">내 FloMe Pay 잔액</span>
            <span className="font-bold text-pink-400">{myBalance.toLocaleString()}원</span>
        </div>

        {/* 상품 목록 */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h2 className="font-bold text-gray-800">{cartItems[0]?.storeName}</h2>
          </div>
          <div>
            {cartItems.map((item, index) => (
              <div key={index} className="flex p-4 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="font-bold text-gray-900">{parseInt(item.price).toLocaleString()}원</p>
                </div>
                <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 p-1 self-start"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 수령 방법 선택 UI */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-500" /> 수령 방법 선택
            </h3>
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-1 transition ${deliveryMethod === 'pickup' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'}`}
                >
                    <Store className="w-5 h-5" /> 매장 픽업
                </button>
                <button 
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-1 transition ${deliveryMethod === 'delivery' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'}`}
                >
                    <Truck className="w-5 h-5" /> 바로 배달
                </button>
                <button 
                    onClick={() => setDeliveryMethod('box')}
                    className={`py-3 rounded-xl border font-bold text-sm flex flex-col items-center gap-1 transition ${deliveryMethod === 'box' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'}`}
                >
                    <Package className="w-5 h-5" /> 무인함
                </button>
            </div>

            {/* 시간 선택 (배달 제외) */}
            {deliveryMethod !== 'delivery' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-gray-500 block mb-1">예약 시간</label>
                    <input 
                        type="datetime-local" 
                        value={reservationDate}
                        onChange={(e) => setReservationDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
            )}
        </div>

        {/* 결제 금액 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">총 주문금액</span><span className="font-bold">{totalPrice.toLocaleString()}원</span></div>
          {deliveryMethod === 'delivery' && <div className="flex justify-between text-sm"><span className="text-gray-500">배달팁</span><span className="font-bold text-pink-500">무료 (이벤트)</span></div>}
          <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-bold text-gray-900"><span>결제예정금액</span><span className="text-pink-500">{finalPrice.toLocaleString()}원</span></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
        <button 
          onClick={handlePayment} 
          className="w-full bg-pink-500 text-white font-bold h-14 rounded-xl shadow-lg hover:bg-pink-600 transition flex items-center justify-center gap-2"
        >
          <span>{finalPrice.toLocaleString()}원 결제하기</span>
        </button>
      </div>
    </div>
  );
};

export default Cart;