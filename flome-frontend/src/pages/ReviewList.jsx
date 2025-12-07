import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Camera, ThumbsUp, Loader2 } from 'lucide-react';
import api from '../api/axios';

const ReviewList = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // store_id
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeName, setStoreName] = useState("가게");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // 1. 가게 정보 조회 (이름 표시용)
        const storeRes = await api.get(`/stores/${id}`);
        setStoreName(storeRes.data.name);

        // 2. 리뷰 목록 조회
        const reviewRes = await api.get(`/stores/${id}/reviews`);
        setReviews(reviewRes.data);
      } catch (error) {
        console.error("리뷰 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchReviews();
  }, [id]);

  // 평균 평점 계산
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* 1. 상단 헤더 */}
      <div className="bg-white sticky top-0 z-50 px-4 h-14 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{storeName} 리뷰</h1>
      </div>

      {/* 2. 평점 요약 박스 */}
      <div className="bg-white p-6 mb-2 border-b border-gray-100 text-center">
        <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
        <div className="flex justify-center text-yellow-400 mb-2">
           {[...Array(5)].map((_, i) => (
             <Star key={i} className={`w-6 h-6 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-200'}`} />
           ))}
        </div>
        <p className="text-gray-400 text-sm">최근 리뷰 {reviews.length}개</p>
      </div>

      {/* 3. 리뷰 리스트 */}
      <div className="bg-white">
        {reviews.length === 0 ? (
            <div className="p-10 text-center text-gray-400">작성된 리뷰가 없습니다.</div>
        ) : (
            reviews.map((review) => (
            <div key={review.review_id} className="p-5 border-b border-gray-100 last:border-0">
                {/* 유저 정보 */}
                <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="font-bold text-gray-900 mr-2">{review.writer_id}님</span>
                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                </div>
                </div>

                {/* 리뷰 내용 */}
                <p className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                {review.content}
                </p>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;