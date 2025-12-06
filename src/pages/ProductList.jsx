import { useState, useEffect } from 'react';
import { Search, Star, Heart, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios'; // 🌟 2단계에서 만든 설정 파일 가져오기

const ProductList = () => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState([]);
  const [activeIndices, setActiveIndices] = useState({});
  
  // 🌟 진짜 데이터를 담을 그릇 (초기값은 빈 배열)
  const [stores, setStores] = useState([]); 
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  // 🌟 화면이 켜지면 백엔드한테 데이터 요청하기
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        // 백엔드 API 주소 (Swagger 보고 수정 필요할 수 있음)
        // 예: /api/stores 또는 /stores
        const response = await axios.get('/stores'); 
        console.log("백엔드에서 받은 데이터:", response.data);
        
        // 받아온 데이터가 배열이면 넣고, 아니면 빈 배열
        setStores(Array.isArray(response.data) ? response.data : []); 
      } catch (err) {
        console.error("데이터 통신 에러:", err);
        setError("가게 정보를 불러오지 못했습니다.");
        
        // 🚨 에러 나면 일단 테스트용 가짜 데이터라도 보여주기 (개발용)
        setStores(MOCK_STORES); 
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const toggleLike = (id) => { /* 찜하기 로직 생략 */ };

  // ... (스크롤 관련 함수들은 그대로 유지) ...
  const scrollContainer = (storeId, direction) => { /* ... */ };
  const handleScroll = (storeId, e) => { /* ... */ };
  const scrollToImage = (storeId, index) => { /* ... */ };

  // 로딩 중일 때 보여줄 화면
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-pink-500"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더, 필터 버튼 코드는 그대로 유지... */}
      
      {/* 가게 리스트 */}
      <div className="flex flex-col gap-2 bg-gray-50"> 
        {/* 데이터가 없을 때 안내 문구 */}
        {stores.length === 0 && !loading && (
           <div className="p-10 text-center text-gray-400">등록된 꽃집이 없습니다 😢</div>
        )}

        {stores.map((store) => (
          <div key={store.id} className="bg-white pb-6">
            {/* ... 기존 렌더링 코드 ... */}
             {/* 주의: 백엔드 데이터 필드명과 프론트엔드 필드명이 다를 수 있습니다.
                예: store.storeName (프론트) vs store.name (백엔드)
                이 부분은 console.log(response.data)를 보고 맞춰줘야 합니다.
             */}
             <div onClick={() => navigate(`/store/${store.id}`)} className="px-4 pt-5 pb-3 flex justify-between items-start cursor-pointer hover:bg-gray-50 transition">
              <div>
                {/* 백엔드 필드명에 맞게 수정 필요 (예: store.name || store.storeName) */}
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{store.storeName || store.name || "가게명 없음"}</h3> 
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-900">{store.rating || 0.0}</span>
                  <span>({store.reviewCount || 0})</span>
                  <span>•</span>
                  <span>{store.address || "거리 정보 없음"}</span>
                </div>
              </div>
              {/* ... 하트 버튼 ... */}
            </div>

            {/* 이미지 슬라이드 부분 */}
            {/* 백엔드 데이터에 images 배열이 없다면 빈 배열로 처리 */}
            <div className="relative group px-1">
               {/* ... 슬라이드 코드 ... */}
               <div id={`store-scroll-${store.id}`} className="flex overflow-x-auto gap-3 px-4 scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth">
                 {(store.images || []).map((img, idx) => (
                    // 이미지 렌더링 코드
                    <div key={idx} className="snap-center shrink-0 w-[140px]">
                       {/* ... */}
                    </div>
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-10"></div>
    </div>
  );
};

// 🚨 백엔드 연결 실패 시 보여줄 임시 데이터 (백업용)
const MOCK_STORES = [
  { 
      id: 101, 
      storeName: "플로미 강남본점 (오프라인 모드)", 
      rating: 4.9, reviewCount: 128, distance: "0.5km", deliveryTime: "20~30분", 
      images: [{ id: 'img1', name: "테스트 장미", price: "35,000", color: "bg-red-100", icon: "🌹" }]
  }
];

export default ProductList;