import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, ShoppingCart, Star, Clock, 
  ChevronDown, Plus, X, Camera, ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import axios from '../api/axios';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [store, setStore] = useState(null); // 가게 정보
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('delivery'); 
  const [cartCount, setCartCount] = useState(0); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 

  useEffect(() => {
    const fetchStoreDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/stores/${id}`);
        console.log("가게 상세 데이터:", response.data);
        setStore(response.data);
      } catch (err) {
        console.error("가게 정보 로딩 실패:", err);
        setError("가게 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetail();

    // 장바구니 상태 초기화
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(savedCart.length);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const getProductEmoji = (name) => {
    if (name.includes('장미')) return '🌹';
    if (name.includes('튤립')) return '🌷';
    if (name.includes('프리지아')) return '🌼';
    if (name.includes('카네이션')) return '🌺';
    if (name.includes('백합')) return '⚜️';
    if (name.includes('안개')) return '🌫️';
    if (name.includes('수국')) return '🌸';
    if (name.includes('해바라기')) return '🌻';
    return '💐';
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAddToCart = (item) => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    // store가 null일 수 있으므로 체크
    if (!store) return;

    const newItem = { 
      id: item.product_id, // id 통일
      name: item.name, 
      price: item.price,
      storeName: store.name,
      storeId: store.store_id
    }; 
    const updatedCart = [...currentCart, newItem];
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    
    if (navigator.vibrate) navigator.vibrate(50); 
  };

  const scrollReviews = (direction) => {
    const container = document.getElementById('reviews-scroll-container');
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // 가짜 리뷰 데이터 (아직 백엔드 연결 안됨)
  const reviews = [
    { id: 1, user: "dooly**", rating: 5, content: "여자친구가 너무 좋아해요! 꽃 상태 최고🌹", img: "bg-red-100", tag: "사진리뷰" },
    { id: 2, user: "hgd**", rating: 5, content: "배달도 빠르고 포장도 꼼꼼합니다.", img: "bg-blue-100", tag: "재주문" },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-pink-500"/></div>;
  if (error || !store) return <div className="min-h-screen flex items-center justify-center text-gray-500">가게를 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* 상단 헤더 */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isSearchOpen ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          
          {isSearchOpen ? (
            <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="메뉴명으로 검색..." 
                  autoFocus
                  className="w-full bg-gray-100 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button 
                onClick={() => navigate('/products')} 
                className={`p-2 rounded-full transition ${isScrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white bg-black/20 hover:bg-black/30'}`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 rounded-full transition ${isScrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white bg-black/20 hover:bg-black/30'}`}
                >
                  <Search className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => navigate('/cart')} 
                  className={`p-2 rounded-full relative transition ${isScrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white bg-black/20 hover:bg-black/30'}`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-pink-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 가게 배너 */}
      <div className={`w-full h-64 bg-pink-100 relative flex items-center justify-center`}>
        <span className="text-8xl filter drop-shadow-md">🏡</span>
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gray-50 rounded-t-[2rem]"></div>
      </div>

      {/* 가게 정보 */}
      <div className="px-5 -mt-2 bg-gray-50 relative">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{store.name}</h1>
          <div className="flex items-center justify-center gap-1 text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold">4.9</span> {/* 평점 임시값 */}
            <span className="text-gray-400">(100+)</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{store.address}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-1 flex mb-6 shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('delivery')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'delivery' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>배달</button>
          <button onClick={() => setActiveTab('pickup')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'pickup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>픽업</button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-2">
             <span className="text-gray-500 text-sm">영업시간</span>
             <span className="font-bold text-gray-900">{store.business_hours || "09:00 ~ 22:00"}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-1"><span className="text-gray-500 text-sm">배달시간</span><Clock className="w-3 h-3 text-gray-400" /></div>
             <span className="font-bold text-gray-900">30~45분</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-gray-500 text-sm">배달팁</span>
             <span className="font-bold text-gray-900">무료</span>
          </div>
        </div>
      </div>

      {/* 리뷰 슬라이드 (가짜 데이터) */}
      <div className="bg-gray-50 overflow-hidden pb-6">
        <div className="flex justify-between items-center px-5 mb-3">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1">최근 리뷰 <span className="text-pink-500">{reviews.length}</span></h3>
          <span className="text-xs text-gray-400 cursor-pointer">전체보기 &gt;</span>
        </div>
        <div className="relative group px-1">
          <button onClick={() => scrollReviews('left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition"><ChevronLeft className="w-5 h-5" /></button>
          <div id="reviews-scroll-container" className="flex overflow-x-auto gap-3 px-5 scrollbar-hide scroll-smooth">
            {reviews.map((review) => (
              <div key={review.id} className="min-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex text-yellow-400 mb-1">{[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                    <span className="text-xs text-gray-400">{review.user}님</span>
                  </div>
                  {review.tag && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm">{review.tag}</span>}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{review.content}</p></div>
                  {review.img && <div className={`w-14 h-14 rounded-lg ${review.img} flex-shrink-0 flex items-center justify-center text-xl`}>📷</div>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => scrollReviews('right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* 메뉴 리스트 (API 데이터 사용) */}
      <div className="bg-white">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">전체 상품</h2>
        </div>
        <div>
            {(store.products || []).length === 0 && (
                <div className="p-10 text-center text-gray-400">상품이 준비 중입니다.</div>
            )}
            {(store.products || []).map((item) => (
            <div key={item.product_id} className="flex justify-between p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex-1 pr-4">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">싱싱하고 예쁜 꽃입니다.</p>
                <p className="font-bold text-gray-900 text-lg">{formatPrice(item.price)}원</p>
                </div>
                <div className="relative w-28 h-28 flex-shrink-0">
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-5xl">
                    {getProductEmoji(item.name)}
                </div>
                {/* 🌟 담기 버튼 */}
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item); // 담기 함수 실행
                    }}
                    className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-pink-50 transition active:scale-90"
                >
                    <Plus className="w-5 h-5 text-gray-700" />
                </button>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* 🌟 플로팅 장바구니 버튼 */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-4 max-w-md mx-auto">
          <button 
            onClick={() => navigate('/cart')} // 장바구니 페이지로 이동
            className="w-full bg-pink-500 text-white font-bold h-14 rounded-xl shadow-lg flex items-center justify-between px-6 hover:bg-pink-600 transition transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white text-pink-500 flex items-center justify-center text-xs font-bold">
                {cartCount}
              </div>
              <span>장바구니 보기</span>
            </div>
            {/* 가격 합계는 프론트에서 계산하기 복잡해졌으므로 일단 숨김 or 개수만 표시 */}
            <span>이동하기 &gt;</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;