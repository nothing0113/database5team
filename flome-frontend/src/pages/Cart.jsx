import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [myBalance, setMyBalance] = useState(0); // 내 잔액 상태

  useEffect(() => {
    // 장바구니 불러오기
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    // 🌟 내 잔액 불러오기
    const balance = localStorage.getItem('userBalance');
    if (balance) setMyBalance(parseInt(balance));
    else {
        // 잔액이 없으면 0원 혹은 초기화 로직 (여기선 0원 처리)
        setMyBalance(0);
    }
  }, []);

  const parsePrice = (priceStr) => parseInt(priceStr.replace(/,/g, ''), 10);
  const totalPrice = cartItems.reduce((acc, item) => acc + parsePrice(item.price), 0);
  const finalPrice = totalPrice; // 배달비 무료 가정

  const removeItem = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // 🌟 핵심: 결제 및 차감 로직
  const handlePayment = () => {
    if (cartItems.length === 0) return;

    // 1. 잔액 부족 확인
    if (myBalance < finalPrice) {
      alert(`잔액이 부족합니다! 😱\n현재 잔액: ${myBalance.toLocaleString()}원\n필요 금액: ${finalPrice.toLocaleString()}원`);
      return;
    }

    // 2. 결제 진행 (차감)
    const newBalance = myBalance - finalPrice;
    localStorage.setItem('userBalance', newBalance.toString()); // 잔액 업데이트
    
    // 3. 장바구니 비우기 및 성공 처리
    clearCart();
    alert(`결제가 완료되었습니다! 🌸\n남은 잔액: ${newBalance.toLocaleString()}원`);
    navigate('/mypage'); // 마이페이지로 이동해서 잔액 확인
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
        {/* 현재 잔액 표시 배너 */}
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
                  <p className="text-sm text-gray-500 mb-2">기본: 가격 {item.price}원</p>
                  <p className="font-bold text-gray-900">{item.price}원</p>
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
          onClick={handlePayment} // 🌟 결제 함수 연결
          className="w-full bg-pink-500 text-white font-bold h-14 rounded-xl shadow-lg hover:bg-pink-600 transition flex items-center justify-center gap-2"
        >
          <span>{finalPrice.toLocaleString()}원 결제하기</span>
        </button>
      </div>
    </div>
  );
};

export default Cart;