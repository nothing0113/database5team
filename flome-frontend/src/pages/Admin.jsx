import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, ClipboardList, CheckCircle, 
  RefreshCw, User, Trash2, Plus, X, Edit2, Loader2, Gift,
  ToggleLeft, ToggleRight, Clock, MapPin, Store as StoreIcon
} from 'lucide-react';
import api from '../api/axios';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stock'); // stock | products | orders | info | dash
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [myStore, setMyStore] = useState(null);

  // 데이터 상태
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [knownFlowers, setKnownFlowers] = useState([]);

  // 폼 데이터
  const [newStock, setNewStock] = useState({
    name: '',
    qty: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: ''
  });
  const [storeForm, setStoreForm] = useState({ // 가게 정보 수정 폼
    name: '',
    address: '',
    business_hours: '',
    has_pickup_box: false
  });

  // 초기화
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      alert("로그인이 필요합니다.");
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);

    fetchMyStore(user.member_id);
    fetchKnownFlowers();
  }, []);

  useEffect(() => {
    if (myStore) {
        setStoreForm({
            name: myStore.name,
            address: myStore.address,
            business_hours: myStore.business_hours || '',
            has_pickup_box: myStore.has_pickup_box
        });
    }
  }, [myStore]);

  const fetchMyStore = async (memberId) => {
    try {
      const response = await api.get('/stores');
      const myOwnStore = response.data.find(store => store.owner_id === memberId);
      
      if (myOwnStore) {
        setMyStore(myOwnStore);
        fetchStocks(myOwnStore.store_id);
        fetchProducts(myOwnStore.store_id);
        fetchOrders(myOwnStore.store_id);
      } else {
        alert("등록된 가게가 없습니다.");
        navigate('/');
      }
    } catch (error) {
      console.error("가게 정보 로딩 실패:", error);
    }
  };

  const fetchStocks = async (storeId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/stores/${storeId}/stocks`);
      setStocks(response.data);
    } catch (error) {
      console.error("재고 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (storeId) => {
    try {
      const response = await api.get(`/stores/${storeId}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("상품 로딩 실패:", error);
    }
  };

  const fetchOrders = async (storeId) => {
    try {
      const response = await api.get('/owner/orders', { params: { store_id: storeId } });
      setOrders(response.data);
    } catch (error) {
      console.error("주문 로딩 실패:", error);
    }
  };

  const fetchKnownFlowers = async () => {
    try {
      const response = await api.get('/flowers');
      setKnownFlowers(response.data);
    } catch (error) {
      console.error("꽃 목록 로딩 실패:", error);
    }
  };

  const handleRefresh = () => {
    if (myStore) {
      fetchStocks(myStore.store_id);
      fetchProducts(myStore.store_id);
      fetchOrders(myStore.store_id);
      alert("업데이트 완료");
    }
  };

  // --- 핸들러 ---

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStock.name || !newStock.qty) return;
    try {
      await api.post('/stocks', {
        store_id: myStore.store_id,
        flower_name: newStock.name,
        quantity: parseInt(newStock.qty),
        input_date: new Date(newStock.date).toISOString()
      });
      alert("입고 등록 완료!");
      setIsModalOpen(false);
      setNewStock({ name: '', qty: '', date: new Date().toISOString().split('T')[0] });
      fetchStocks(myStore.store_id);
    } catch (error) {
      alert("등록 실패");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    try {
      await api.post('/products', {
        store_id: myStore.store_id,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        type: "READY_MADE"
      });
      alert("상품 등록 완료!");
      setIsModalOpen(false);
      setNewProduct({ name: '', price: '' });
      fetchProducts(myStore.store_id);
    } catch (error) {
      console.error(error);
      alert("상품 등록 실패");
    }
  };

  const handleDeleteStock = async (id, name) => {
    if (window.confirm(`'${name}' 재고를 삭제하시겠습니까?`)) {
      await api.delete(`/stocks/${id}`);
      fetchStocks(myStore.store_id);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    await api.put(`/orders/${id}/status`, { status: newStatus });
    fetchOrders(myStore.store_id);
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/stores/${myStore.store_id}`, storeForm);
      alert("가게 정보가 업데이트되었습니다!");
      fetchMyStore(currentUser.member_id); // 최신 정보 다시 불러오기
    } catch (error) {
      console.error("가게 정보 업데이트 실패:", error);
      alert("가게 정보 업데이트에 실패했습니다.");
    }
  };

  // 신선도 배지 헬퍼
  const getFreshnessStatus = (dateStr) => {
    if (!dateStr) return { label: "알수없음", color: "bg-gray-100 text-gray-600", border: "border-gray-200" };
    const today = new Date();
    const input = new Date(dateStr);
    const diffTime = Math.abs(today - input);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 5) return { label: "폐기대상", color: "bg-red-100 text-red-600", border: "border-red-200" };
    if (diffDays > 3) return { label: "할인권장", color: "bg-orange-100 text-orange-600", border: "border-orange-200" };
    return { label: "신선함", color: "bg-green-100 text-green-600", border: "border-green-200" };
  };

  if (!currentUser || !myStore) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* 헤더 */}
      <div className="bg-blue-600 p-4 text-white sticky top-0 z-40 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">점주 관리자</h1>
            <span className="bg-blue-500 px-2 py-0.5 rounded text-xs">{myStore.name}</span>
          </div>
          <button onClick={() => navigate('/mypage')} className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition">
            <User className="w-4 h-4" /> 마이페이지
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-blue-700/50 p-1 rounded-xl overflow-x-auto">
          {['stock', 'products', 'orders', 'info', 'dash'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:bg-white/10'}`}
            >
              {tab === 'stock' ? '원자재(꽃)' : tab === 'products' ? '판매상품' : tab === 'orders' ? '주문접수' : tab === 'info' ? '가게정보' : '대시보드'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        
        {/* === 1. 원자재(Stock) 탭 === */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <h2 className="font-bold text-gray-800 text-lg">꽃 재고</h2>
                 <button onClick={handleRefresh} className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition"><RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} /></button>
               </div>
               <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm">
                 <Plus className="w-4 h-4" /> 입고
               </button>
            </div>
            {stocks.length === 0 && <p className="text-center text-gray-400 py-5">등록된 꽃 재고가 없습니다.</p>}
            {stocks.map((item) => {
              const status = getFreshnessStatus(item.stocking_date);
              return (
                <div key={item.stock_id} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center ${status.border} ${status.border.replace('border', 'border-l')}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.color}`}>{status.label}</span>
                      <h3 className="font-bold text-gray-900">{item.flower ? item.flower.name : "이름 없음"}</h3>
                    </div>
                    <div className="text-xs text-gray-500">수량: {item.quantity} | 입고: {new Date(item.stocking_date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditQty(item.stock_id, item.quantity)} className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => handleDeleteStock(item.stock_id, item.flower?.name)} className="p-2 bg-red-50 rounded-lg text-red-400 hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              );
            })}
             <p className="text-xs text-gray-400 text-center mt-4">📢 입고 후 5일 경과 시 폐기 경고가 표시됩니다.</p>
          </div>
        )}

        {/* === 2. 판매상품(Products) 탭 === */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="font-bold text-gray-800 text-lg">판매 상품</h2>
               <button onClick={() => setIsModalOpen(true)} className="bg-pink-500 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-pink-600 flex items-center gap-1 shadow-sm">
                 <Plus className="w-4 h-4" /> 상품 등록
               </button>
            </div>
            {products.length === 0 && <p className="text-center text-gray-400 py-10">등록된 상품이 없습니다.</p>}
            {products.map((product) => (
              <div key={product.product_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-500"><Gift className="w-5 h-5"/></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.price.toLocaleString()}원</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{product.type === 'READY_MADE' ? '완제품' : '커스텀'}</span>
              </div>
            ))}
          </div>
        )}

        {/* === 3. 주문 탭 === */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">주문 내역 <span className="text-blue-600 text-sm ml-1">{orders.length}</span></h2>
            {orders.length === 0 && <p className="text-center text-gray-400 py-5">받은 주문이 없습니다.</p>}
            {orders.map((order) => {
                const itemName = order.items.length > 0 ? (order.items[0].product ? order.items[0].product.name : "상품 정보 없음") : "상품 없음";
                const totalPrice = order.items.reduce((acc, i) => acc + (i.snapshot_price * i.quantity), 0);
                return (
                  <div key={order.order_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-400 block mb-1">{new Date(order.order_date).toLocaleString()}</span>
                        <h3 className="font-bold text-lg text-gray-900">{itemName}</h3>
                        {order.ai_content && <div className="mt-1 text-xs bg-pink-50 text-pink-600 p-1 rounded px-2">🌸 AI 요청: {order.ai_content.user_prompt}</div>}
                      </div>
                      <span className="font-bold text-lg">{totalPrice.toLocaleString()}원</span>
                    </div>
                    {order.status === 'PAID' && <button onClick={() => updateOrderStatus(order.order_id, "PREPARING")} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">주문 수락</button>}
                    {order.status === 'PREPARING' && <button onClick={() => updateOrderStatus(order.order_id, "PICKED_UP")} className="w-full py-3 bg-green-500 text-white rounded-lg font-bold">픽업 완료 처리</button>}
                    {order.status === 'PICKED_UP' && <div className="text-center text-gray-400 font-bold py-2">거래 완료</div>}
                  </div>
                );
            })}
          </div>
        )}
        
        {/* === 4. 가게 정보 탭 === */}
        {activeTab === 'info' && (
            <div className="space-y-4">
                <h2 className="font-bold text-gray-800 text-lg mb-4">내 가게 정보</h2>
                <form onSubmit={handleUpdateStore} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">가게 이름</label>
                        <div className="relative">
                            <StoreIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                name="name"
                                value={storeForm.name}
                                onChange={(e) => setStoreForm({...storeForm, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">가게 주소</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                name="address"
                                value={storeForm.address}
                                onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">영업 시간</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                name="business_hours"
                                value={storeForm.business_hours}
                                onChange={(e) => setStoreForm({...storeForm, business_hours: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="예: 09:00 - 20:00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">무인 픽업함</label>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <span className="flex-1">무인 픽업함 사용 여부</span>
                            <button 
                                type="button" 
                                onClick={() => setStoreForm({...storeForm, has_pickup_box: !storeForm.has_pickup_box})}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${storeForm.has_pickup_box ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${storeForm.has_pickup_box ? 'translate-x-5' : 'translate-x-0'}`}>
                                    <span className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${storeForm.has_pickup_box ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'}`} aria-hidden="true">
                                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <span className={`absolute inset-0 h-full w-full flex items-center justify-center transition-opacity ${storeForm.has_pickup_box ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'}`} aria-hidden="true">
                                        <ToggleRight className="w-4 h-4 text-blue-600" />
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 transition">
                        가게 정보 업데이트
                    </button>
                </form>
            </div>
        )}

        {/* === 5. 대시보드 탭 === */}
        {activeTab === 'dash' && (
            <div className="text-center text-gray-400 py-20">대시보드 준비 중...</div>
        )}

      </div>

      {/* 🌟 공용 모달 (탭에 따라 내용 변경) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {activeTab === 'stock' ? '새 꽃 입고 등록' : '새 상품 등록'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
            </div>
            
            {/* 원자재 등록 폼 */}
            {activeTab === 'stock' && (
              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">꽃 이름</label>
                  <input type="text" value={newStock.name} onChange={(e) => setNewStock({...newStock, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" placeholder="예: 노란 튤립" list="flower-options" autoFocus />
                  <datalist id="flower-options">{knownFlowers.map((f) => <option key={f.flower_id} value={f.name} />)}</datalist>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="text-sm font-bold text-gray-700 block mb-1">수량</label><input type="number" value={newStock.qty} onChange={(e) => setNewStock({...newStock, qty: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" placeholder="0" /></div>
                  <div className="flex-1"><label className="text-sm font-bold text-gray-700 block mb-1">입고일</label><input type="date" value={newStock.date} onChange={(e) => setNewStock({...newStock, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" /></div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4">등록하기</button>
              </form>
            )}

            {/* 상품 등록 폼 */}
            {activeTab === 'products' && (
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">상품명</label>
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" placeholder="예: 졸업식 꽃다발" autoFocus />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">가격</label>
                  <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3" placeholder="35000" />
                </div>
                <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl mt-4">상품 등록하기</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;