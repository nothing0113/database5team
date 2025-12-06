import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, ClipboardList, CheckCircle, 
  RefreshCw, User, Trash2, Plus, X, Edit2, Loader2 
} from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock'); // stock | orders | dash
  
  // 🌟 상태 관리 추가
  const [isLoading, setIsLoading] = useState(false); // 새로고침 로딩 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 입고 등록 모달 상태
  
  // 입고 등록 폼 데이터
  const [newStock, setNewStock] = useState({
    name: '',
    qty: '',
    date: new Date().toISOString().split('T')[0] // 오늘 날짜 기본값
  });

  // 1. 재고 데이터 (초기값)
  const [stocks, setStocks] = useState([
    { id: 1, name: "빨간 장미", inputDate: "2025-12-06", qty: 50 },
    { id: 2, name: "화이트 튤립", inputDate: "2025-12-03", qty: 20 },
    { id: 3, name: "안개꽃", inputDate: "2025-11-28", qty: 5 }, 
  ]);

  const [orders, setOrders] = useState([
    { id: 101, customer: "홍길동", item: "로맨틱 장미 10송이", price: 35000, status: "접수대기", time: "10분 전" },
    { id: 102, customer: "김철수", item: "튤립 믹스", price: 28000, status: "준비중", time: "30분 전" },
  ]);

  // --- 🌟 기능 구현부 ---

  // 1. 신선도 계산 (자동 배지)
  const getFreshnessStatus = (dateStr) => {
    const today = new Date("2025-12-06"); // 테스트 기준일
    const input = new Date(dateStr);
    const diffTime = Math.abs(today - input);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 5) return { label: "폐기대상", color: "bg-red-100 text-red-600", border: "border-red-200" };
    if (diffDays > 3) return { label: "할인권장", color: "bg-orange-100 text-orange-600", border: "border-orange-200" };
    return { label: "신선함", color: "bg-green-100 text-green-600", border: "border-green-200" };
  };

  // 2. 새로고침 기능
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("최신 재고 정보를 불러왔습니다!");
    }, 1000); // 1초 뒤 완료
  };

  // 3. 입고 등록 (추가) 기능
  const handleAddStock = (e) => {
    e.preventDefault();
    if (!newStock.name || !newStock.qty) return;

    const newItem = {
      id: Date.now(), // 고유 ID 생성
      name: newStock.name,
      inputDate: newStock.date,
      qty: parseInt(newStock.qty)
    };

    setStocks([newItem, ...stocks]); // 목록 맨 앞에 추가
    setIsModalOpen(false); // 모달 닫기
    setNewStock({ name: '', qty: '', date: new Date().toISOString().split('T')[0] }); // 폼 초기화
    alert(`${newItem.name} 입고 등록 완료!`);
  };

  // 4. 폐기 (삭제) 기능
  const handleDeleteStock = (id, name) => {
    if (window.confirm(`'${name}' 재고를 폐기(삭제)하시겠습니까?`)) {
      setStocks(stocks.filter(item => item.id !== id));
    }
  };

  // 5. 수량 변경 기능
  const handleEditQty = (id, currentQty) => {
    const newQty = prompt("변경할 수량을 입력하세요:", currentQty);
    if (newQty !== null && !isNaN(newQty)) {
      setStocks(stocks.map(item => 
        item.id === id ? { ...item, qty: parseInt(newQty) } : item
      ));
    }
  };

  // 6. 주문 상태 변경
  const updateOrderStatus = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* 헤더 */}
      <div className="bg-blue-600 p-4 text-white sticky top-0 z-40 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">점주 관리자 모드</h1>
            <span className="bg-blue-500 px-2 py-0.5 rounded text-xs">플로미 강남점</span>
          </div>
          <button 
            onClick={() => navigate('/mypage')}
            className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition"
          >
            <User className="w-4 h-4" />
            구매자 모드 전환
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-blue-700/50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('stock')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>재고 관리</button>
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>주문 접수</button>
          <button onClick={() => setActiveTab('dash')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'dash' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}>대시보드</button>
        </div>
      </div>

      <div className="p-4">
        
        {/* === 1. 재고 관리 탭 === */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <h2 className="font-bold text-gray-800 text-lg">실시간 재고</h2>
                 <button onClick={handleRefresh} className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition">
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                 </button>
               </div>
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm transition transform active:scale-95"
               >
                 <Plus className="w-4 h-4" /> 입고 등록
               </button>
            </div>

            {stocks.map((item) => {
              const status = getFreshnessStatus(item.inputDate);
              return (
                <div key={item.id} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center ${status.border} ${status.border.replace('border', 'border-l')}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.color}`}>
                        {status.label}
                      </span>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                       <span>입고: {item.inputDate}</span>
                       <span className="text-gray-300">|</span>
                       <span className="font-bold text-gray-700">수량: {item.qty}개</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* 수량 변경 버튼 */}
                    <button 
                      onClick={() => handleEditQty(item.id, item.qty)}
                      className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    {/* 폐기 버튼 */}
                    <button 
                      onClick={() => handleDeleteStock(item.id, item.name)}
                      className="p-2 bg-red-50 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
             <p className="text-xs text-gray-400 text-center mt-4">📢 입고 후 5일 경과 시 폐기 경고가 표시됩니다.</p>
          </div>
        )}

        {/* === 2. 주문 접수 탭 === */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              주문 목록 <span className="bg-blue-100 text-blue-600 px-2 rounded-full text-sm">{orders.length}</span>
            </h2>
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-400 mb-1 block">{order.time}</span>
                    <h3 className="font-bold text-lg text-gray-900">{order.item}</h3>
                    <p className="text-sm text-gray-500">{order.customer} 고객님</p>
                  </div>
                  <span className="font-bold text-lg">{order.price.toLocaleString()}원</span>
                </div>
                <div className="flex gap-2 mt-4">
                  {order.status === "접수대기" ? (
                    <>
                      <button className="flex-1 py-3 bg-gray-100 rounded-lg font-bold text-gray-500 hover:bg-gray-200">거절</button>
                      <button onClick={() => updateOrderStatus(order.id, "준비중")} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 animate-pulse">주문 수락</button>
                    </>
                  ) : order.status === "준비중" ? (
                     <button onClick={() => updateOrderStatus(order.id, "완료")} className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/> 완료 처리</button>
                  ) : (
                    <div className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-lg text-center">거래 완료됨</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === 3. 대시보드 탭 === */}
        {activeTab === 'dash' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">오늘 매출</p>
                <h3 className="text-2xl font-bold text-blue-600">63,000원</h3>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">주문 건수</p>
                <h3 className="text-2xl font-bold text-gray-800">2건</h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 [모달] 입고 등록 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">새 꽃 입고 등록</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">꽃 이름</label>
                <input 
                  type="text" 
                  value={newStock.name}
                  onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 노란 튤립"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-1">수량 (송이)</label>
                  <input 
                    type="number" 
                    value={newStock.qty}
                    onChange={(e) => setNewStock({...newStock, qty: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-gray-700 block mb-1">입고일</label>
                  <input 
                    type="date" 
                    value={newStock.date}
                    onChange={(e) => setNewStock({...newStock, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 transition">
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;