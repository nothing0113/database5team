import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';
import axios from '../api/axios';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [myBalance, setMyBalance] = useState(0); // 잔액 상태

  useEffect(() => {
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
          // 백엔드에서 최신 잔액 조회
          const response = await axios.get('/me', { 
            params: { member_id: user.member_id } 
          });
          setMyBalance(response.data.money);
        } catch (err) {
          console.error("잔액 정보 로딩 실패:", err);
          // 실패 시 로컬 정보라도 쓰거나 0원 처리
          setMyBalance(user.money || 0);
        }
      }
    };
    
    fetchUserInfo();
  }, []);

  const totalPrice = cartItems.reduce((acc, item) => acc + (parseInt(item.price) || 0), 0);
  const finalPrice = totalPrice;

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

    // 1. 로그인 확인
    if (!currentUser) {
        alert("로그인이 필요합니다!");
        navigate('/login');
        return;
    }

    // 2. 잔액 확인 (프론트엔드 체크)
    if (myBalance < finalPrice) {
        alert(`잔액이 부족합니다! 😱
현재 잔액: ${myBalance.toLocaleString()}원
필요 금액: ${finalPrice.toLocaleString()}원`);
        return;
    }

    // 3. 데이터 가공
    const targetStoreId = cartItems[0].storeId;
    const targetStoreName = cartItems[0].storeName;

    const targetItems = cartItems.filter(item => item.storeId === targetStoreId);
    if (targetItems.length !== cartItems.length) {
        if(!window.confirm(`"${targetStoreName}" 상품만 먼저 주문하시겠습니까?
(다른 가게 상품은 제외됩니다)`)) {
            return;
        }
    }

    const itemsMap = {};
    targetItems.forEach(item => {
        if (itemsMap[item.id]) {
            itemsMap[item.id] += 1;
        } else {
            itemsMap[item.id] = 1;
        }
    });

    const orderItems = Object.keys(itemsMap).map(productId => ({
        product_id: productId,
        quantity: itemsMap[productId]
    }));

    // 4. API 호출
    try {
        const response = await axios.post('/orders', {
            store_id: targetStoreId,
            member_id: currentUser.member_id,
            items: orderItems
        });

        if (response.status === 200) {
            alert(`주문이 완료되었습니다! 🌸
주문번호: ${response.data.order_id.substring(0, 8)}...
남은 잔액: ${(myBalance - finalPrice).toLocaleString()}원`);
            
            clearCart();
            navigate('/'); 
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-50 px-4 h-14 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-800" /></button>
        <h1 className="text-lg font-bold text-gray-900">장바구니</h1>
        <button onClick={clearCart} className="text-xs text-gray-500 hover:text-red-500">전체삭제</button>
      </div>

      <div className="p-4 space-y-4">
        {/* 잔액 표시 배너 */}
        <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
            <span className="font-bold text-sm">내 FloMe Pay 잔액</span>
            <span className="font-bold text-pink-400">{myBalance.toLocaleString()}원</span>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h2 className="font-bold text-gray-800">{cartItems[0]?.storeName || "가게 이름"}</h2>
             <span className="text-xs text-pink-500 font-bold">배달팁 무료</span>
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

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">총 주문금액</span><span className="font-bold">{totalPrice.toLocaleString()}원</span></div>
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