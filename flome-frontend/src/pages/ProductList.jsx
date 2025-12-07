import { useState, useEffect } from 'react';
import { Search, Star, Heart, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const ProductList = () => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState([]);
  const [activeIndices, setActiveIndices] = useState({});
  
  const [stores, setStores] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/stores'); 
        console.log("백엔드 데이터:", response.data);
        setStores(Array.isArray(response.data) ? response.data : []); 
      } catch (err) {
        console.error("데이터 통신 에러:", err);
        setError("가게 정보를 불러오지 못했습니다.");
        setStores(MOCK_STORES); 
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // 상품 이름에 따라 이모지 반환하는 함수
  const getProductEmoji = (name) => {
    if (name.includes('장미')) return '🌹';
    if (name.includes('튤립')) return '🌷';
    if (name.includes('프리지아')) return '🌼';
    if (name.includes('카네이션')) return '🌺';
    if (name.includes('백합')) return '⚜️';
    if (name.includes('안개')) return '🌫️';
    if (name.includes('수국')) return '🌸';
    if (name.includes('해바라기')) return '🌻';
    return '💐'; // 기본값
  };

  // 가격 포맷팅 (1000 -> 1,000)
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toggleLike = (id) => {
    if (liked.includes(id)) {
      setLiked(liked.filter(item => item !== id));
    } else {
      setLiked([...liked, id]);
    }
  };

  const scrollContainer = (storeId, direction) => {
    const container = document.getElementById(`store-scroll-${storeId}`);
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = (storeId, e) => {
    const container = e.target;
    const index = Math.round(container.scrollLeft / 150);
    setActiveIndices(prev => ({ ...prev, [storeId]: index }));
  };

  const scrollToImage = (storeId, index) => {
    const container = document.getElementById(`store-scroll-${storeId}`);
    if (container) {
      container.scrollTo({ left: index * 150, behavior: 'smooth' });
      setActiveIndices(prev => ({ ...prev, [storeId]: index }));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-pink-500"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-2 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
           <ArrowLeft onClick={() => navigate(-1)} className="w-6 h-6 text-gray-800 cursor-pointer" />
           <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder="꽃집, 꽃 검색" 
               className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
             />
             <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
           </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['전체', '배달가능', '픽업가능', '예약가능', '평점순'].map((filter, idx) => (
            <button 
              key={idx}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${idx === 0 ? 'bg-pink-500 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 가게 리스트 */}
      <div className="flex flex-col gap-2 bg-gray-50"> 
        {stores.length === 0 && !loading && (
           <div className="p-10 text-center text-gray-400">등록된 꽃집이 없습니다 😢</div>
        )}

        {stores.map((store) => (
          <div key={store.store_id} className="bg-white pb-6"> {/* store_id 사용 */}
             <div onClick={() => navigate(`/store/${store.store_id}`)} className="px-4 pt-5 pb-3 flex justify-between items-start cursor-pointer hover:bg-gray-50 transition">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{store.name}</h3> 
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-900">{store.average_rating || "0.0"}</span>
                  <span>({store.review_count || 0})</span>
                  <span>•</span>
                  <span>{store.address ? store.address.split(' ')[1] : "거리 정보 없음"}</span> {/* 주소 간단히 */}
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLike(store.store_id); }} 
                className="p-2 -mr-2"
              >
                <Heart className={`w-6 h-6 transition ${liked.includes(store.store_id) ? 'fill-pink-500 text-pink-500 scale-110' : 'text-gray-300 hover:text-gray-400'}`} />
              </button>
            </div>

            {/* 상품 슬라이드 (products 사용) */}
            <div className="relative group px-1">
               <button onClick={() => scrollContainer(store.store_id, 'left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition duration-300"><ChevronLeft className="w-5 h-5" /></button>
               
               <div 
                  id={`store-scroll-${store.store_id}`} 
                  className="flex overflow-x-auto gap-3 px-4 scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                  onScroll={(e) => handleScroll(store.store_id, e)}
               >
                 {/* 상품이 없으면 안내 메시지 */}
                 {(!store.products || store.products.length === 0) && (
                    <div className="w-full py-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg">
                       준비 중인 상품이 없습니다
                    </div>
                 )}

                 {(store.products || []).map((product, idx) => (
                    <div key={product.product_id || idx} className="snap-center shrink-0 w-[140px]">
                       <div className="relative aspect-square rounded-xl bg-pink-50 overflow-hidden mb-2 flex items-center justify-center text-6xl shadow-inner">
                          {/* 이모지 표시 */}
                          {getProductEmoji(product.name)}
                          {/* <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">BEST</span> */}
                       </div>
                       <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                       <p className="text-sm font-bold text-pink-500">{formatPrice(product.price)}원</p>
                    </div>
                 ))}
               </div>
               
               <button onClick={() => scrollContainer(store.store_id, 'right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition duration-300"><ChevronRight className="w-5 h-5" /></button>
            </div>

            {/* 인디케이터 */}
            {store.products && store.products.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-1">
                {store.products.slice(0, 5).map((_, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => scrollToImage(store.store_id, idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeIndices[store.store_id] === idx ? 'w-4 bg-pink-500' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="h-10"></div>
    </div>
  );
};

const MOCK_STORES = [
  { 
      store_id: 'mock-1', 
      name: "플로미 강남본점 (오프라인)", 
      rating: 4.9, 
      review_count: 128, 
      address: "서울 강남구", 
      products: [{ product_id: 'p1', name: "테스트 장미", price: 35000 }]
  }
];

export default ProductList;