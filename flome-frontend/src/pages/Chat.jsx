import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeft, Send, Sparkles, Flower2, Mail, Droplets, 
  Thermometer, Sun, Sprout, MapPin, ShoppingBag, RefreshCw
} from 'lucide-react';

const Chat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(''); // 로딩 메시지 상태 추가
  
  // 초기 메시지 (LocalStorage 연동)
  const [messages, setMessages] = useState(() => {
    const savedHistory = localStorage.getItem('chat_history');
    return savedHistory ? JSON.parse(savedHistory) : [
      { 
        id: 1, 
        sender: 'bot', 
        type: 'text', 
        content: "안녕하세요! FloMe AI 플로리스트입니다. 🌸\n현재 상황이나 전하고 싶은 마음을 말씀해 주시면, 딱 맞는 꽃과 편지를 추천해 드릴게요.\n(예: 여자친구와 헤어져서 마음을 전하고 싶어)" 
      }
    ];
  });

  // 메시지 변경 시 저장
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // 스크롤 자동 내리기
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 대화 초기화
  const handleReset = () => {
    if (window.confirm("대화 내용을 모두 지우고 처음부터 시작할까요?")) {
      localStorage.removeItem('chat_history');
      setMessages([
        { 
          id: 1, 
          sender: 'bot', 
          type: 'text', 
          content: "안녕하세요! FloMe AI 플로리스트입니다. 🌸\n현재 상황이나 전하고 싶은 마음을 말씀해 주시면, 딱 맞는 꽃과 편지를 추천해 드릴게요.\n(예: 여자친구와 헤어져서 마음을 전하고 싶어)" 
        }
      ]);
    }
  };

  // 메시지 전송 핸들러
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. 유저 메시지 추가
    const userMessage = { id: Date.now(), sender: 'user', type: 'text', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setLoadingMessage("AI가 상황을 분석하고 있어요...");

    try {
      // 2. Fetch API로 스트리밍 요청 (Axios 대신 사용)
      const response = await fetch(`http://localhost:8000/api/recommend?situation=${encodeURIComponent(currentInput)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.body) throw new Error("ReadableStream not supported.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 마지막 불완전한 라인은 버퍼에 유지

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'progress') {
              setLoadingMessage(data.message);
            } else if (data.type === 'result') {
              const result = data.data;
              // 3. 봇의 추천 카드 메시지 추가
              const botResponse = {
                id: Date.now() + 1,
                sender: 'bot',
                type: 'recommendation',
                data: { ...result, original_prompt: currentInput }
              };
              setMessages(prev => [...prev, botResponse]);
            }
          } catch (parseError) {
            console.error("JSON 파싱 에러:", parseError);
          }
        }
      }

    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'text',
        content: "죄송합니다. 꽃 추천을 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  const handleAddToCart = (store, aiData) => {
    if (!store.product_id) {
      alert("이 매장은 현재 온라인 주문 상품 정보가 없습니다. 매장으로 문의해주세요.");
      return;
    }

    const newItem = {
      id: store.product_id,
      name: `[AI] ${aiData.title || '나만의 꽃다발'}`,
      price: store.product_price || 0,
      storeId: store.store_id,
      storeName: store.name,
      quantity: 1,
      image: null // 이미지 없음
    };

    // 장바구니 로드 및 추가
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // 다른 가게 상품이 있다면 비우고 담을지 물어보는 로직이 있으면 좋지만, 여기서는 일단 추가
    // (Cart.jsx에서 결제 시 가게 체크함)
    const updatedCart = [...existingCart, newItem];
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // AI 데이터 저장 (주문 시 전송용)
    localStorage.setItem('pending_ai_data', JSON.stringify({
      user_prompt: aiData.original_prompt,
      letter_content: aiData.letter,
      recipe: JSON.stringify(aiData.flowers), // 꽃 조합을 문자열로 저장
      care_guide: aiData.care_guide
    }));

    if (window.confirm("장바구니에 상품을 담았습니다! 🛒\n장바구니로 이동하시겠습니까?")) {
      navigate('/cart');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      
      {/* 1. 채팅방 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              FloMe AI 상담
              <Sparkles className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-500">실시간 추천 중...</p>
          </div>
        </div>
        <button onClick={handleReset} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full" title="대화 초기화">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* 2. 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* 봇 프로필 아이콘 */}
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-2 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-pink-500" />
              </div>
            )}

            {/* 메시지 내용 */}
            <div className={`max-w-[85%] ${msg.sender === 'user' ? 'bg-pink-500 text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none'} p-4 shadow-sm`}>
              
              {/* A. 일반 텍스트 메시지 */}
              {msg.type === 'text' && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              )}

              {/* B. 꽃 추천 카드 메시지 (JSON 데이터 시각화) */}
              {msg.type === 'recommendation' && (
                <div className="space-y-4 min-w-[280px]">
                  {/* 타이틀 */}
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-lg text-pink-600 mb-1">{msg.data.title}</h3>
                    <p className="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded-full">
                      🎨 {msg.data.color_theme}
                    </p>
                  </div>

                  {/* 1. 추천 꽃 리스트 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                      <Flower2 className="w-4 h-4 text-pink-500" /> 추천 구성
                    </h4>
                    <div className="space-y-2">
                      {msg.data.flowers && msg.data.flowers.map((flower, idx) => (
                        <div key={idx} className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-800">{flower.name}</span>
                            <span className="text-[10px] font-bold bg-white text-pink-500 px-1.5 py-0.5 rounded border border-pink-200">{flower.role}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-snug">{flower.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. 추천 편지 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-blue-400" /> 마음을 전하는 편지
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 italic border-l-4 border-blue-200 relative">
                      <span className="absolute top-2 left-2 text-2xl text-gray-300">"</span>
                      <p className="px-2">{msg.data.letter}</p>
                      <span className="absolute bottom-[-10px] right-4 text-2xl text-gray-300">"</span>
                    </div>
                  </div>

                  {/* 3. 관리 가이드 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                      <Sprout className="w-4 h-4 text-green-500" /> 관리법
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1 bg-green-50/50 p-3 rounded-xl">
                      {Array.isArray(msg.data.care_guide) && msg.data.care_guide.map((guide, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-green-500">•</span>
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 4. 주문 가능한 매장 (New) */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
                       <MapPin className="w-4 h-4 text-purple-500" /> 주문 가능한 매장
                    </h4>
                    {msg.data.available_stores && msg.data.available_stores.length > 0 ? (
                      <div className="space-y-2">
                        {msg.data.available_stores.map((store) => (
                          <div key={store.store_id} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-pink-300 transition">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="font-bold text-sm text-gray-800 truncate">{store.name}</p>
                              <p className="text-xs text-gray-500 truncate">{store.address}</p>
                              {store.product_price && (
                                <p className="text-xs text-pink-500 font-bold mt-1">예상가: {store.product_price.toLocaleString()}원</p>
                              )}
                            </div>
                            <button 
                              onClick={() => handleAddToCart(store, msg.data)}
                              className="bg-pink-500 text-white text-xs px-3 py-2 rounded-lg hover:bg-pink-600 transition flex-shrink-0 flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              담기
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-xl text-center">
                        현재 이 구성으로 주문 가능한 매장이 주변에 없습니다. 😢
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              <span className="text-sm text-gray-700">{loadingMessage}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. 입력창 영역 */}
      <form onSubmit={handleSend} className="bg-white p-4 border-t border-gray-100 sticky bottom-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="상황을 입력하세요 (예: 여자친구와 화해하고 싶어)"
            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default Chat;
