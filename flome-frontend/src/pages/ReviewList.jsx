import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Camera, ThumbsUp } from 'lucide-react';

const ReviewList = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL에서 가게 ID 가져옴

  // 가짜 리뷰 데이터 (더 많이 추가함)
  const reviews = [
    { id: 1, user: "dooly**", rating: 5, date: "어제", content: "여자친구가 너무 좋아해요! 꽃 상태 최고🌹 배달도 예상보다 빨리 도착해서 서프라이즈 성공했습니다.", img: "bg-red-100", tag: "사진리뷰", items: "로맨틱 레드 장미 10송이" },
    { id: 2, user: "hgd**", rating: 5, date: "3일 전", content: "배달도 빠르고 포장도 꼼꼼합니다. 다음에도 여기서 시킬게요.", img: "bg-blue-100", tag: "재주문", items: "파스텔 튤립 믹스" },
    { id: 3, user: "flower**", rating: 4, date: "지난주", content: "생각보다 풍성하네요. 감사합니다. 다만 배달 기사님이 조금 늦으셨어요.", img: null, tag: null, items: "화려한 프리지아 다발" },
    { id: 4, user: "love**", rating: 5, date: "지난달", content: "기념일 선물로 딱이에요! 사장님이 서비스로 주신 카드도 너무 감동입니다.", img: "bg-yellow-100", tag: "사진리뷰", items: "대형 믹스 꽃다발" },
    { id: 5, user: "happy**", rating: 5, date: "지난달", content: "꽃이 싱싱하고 향기가 너무 좋아요.", img: "bg-purple-100", tag: "단골", items: "로맨틱 레드 장미 10송이" },
    { id: 6, user: "guest123", rating: 1, date: "2달 전", content: "꽃이 시들어서 왔어요... 실망입니다.", img: null, tag: null, items: "미니 장미 바구니" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* 1. 상단 헤더 */}
      <div className="bg-white sticky top-0 z-50 px-4 h-14 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">플로미 강남본점 리뷰</h1>
      </div>

      {/* 2. 평점 요약 박스 */}
      <div className="bg-white p-6 mb-2 border-b border-gray-100 text-center">
        <div className="text-5xl font-bold text-gray-900 mb-2">4.9</div>
        <div className="flex justify-center text-yellow-400 mb-2">
           <Star className="w-6 h-6 fill-current" />
           <Star className="w-6 h-6 fill-current" />
           <Star className="w-6 h-6 fill-current" />
           <Star className="w-6 h-6 fill-current" />
           <Star className="w-6 h-6 fill-current" />
        </div>
        <p className="text-gray-400 text-sm">최근 리뷰 1,345개</p>
      </div>

      {/* 3. 리뷰 리스트 */}
      <div className="bg-white">
        {reviews.map((review) => (
          <div key={review.id} className="p-5 border-b border-gray-100 last:border-0">
            {/* 유저 정보 */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-bold text-gray-900 mr-2">{review.user}님</span>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
              </div>
            </div>

            {/* 사진이 있다면 */}
            {review.img && (
              <div className={`w-full h-48 rounded-xl ${review.img} mb-3 flex items-center justify-center text-4xl bg-cover bg-center`}>
                📷
              </div>
            )}

            {/* 리뷰 내용 */}
            <p className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
              {review.content}
            </p>

            {/* 주문한 메뉴 & 태그 */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mb-2">
              <span className="font-bold">주문메뉴:</span> {review.items}
            </div>
            
            {review.tag && (
              <span className="inline-block bg-pink-50 text-pink-500 text-[10px] font-bold px-2 py-1 rounded-full">
                {review.tag}
              </span>
            )}
            
            {/* 사장님 답글 (예시) */}
            {review.rating === 5 && (
              <div className="mt-4 bg-gray-50 p-4 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">사장님</span>
                    <span className="text-xs text-gray-400">1시간 전</span>
                 </div>
                 <p className="text-sm text-gray-700">
                   소중한 리뷰 감사합니다! {review.user}님 덕분에 오늘도 힘이 나네요 🌸 
                   다음에도 예쁜 꽃으로 보답하겠습니다!
                 </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;