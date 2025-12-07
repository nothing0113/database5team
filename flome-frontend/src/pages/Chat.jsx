import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Sparkles, Flower2, Mail, Droplets, 
  Thermometer, Sun, Sprout 
} from 'lucide-react';

const Chat = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 초기 메시지
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      type: 'text', 
      content: "안녕하세요! FloMe AI 플로리스트입니다. 🌸\n현재 상황이나 전하고 싶은 마음을 말씀해 주시면, 딱 맞는 꽃과 편지를 추천해 드릴게요.\n(예: 여자친구와 헤어져서 마음을 전하고 싶어)" 
    }
  ]);

  // 🌟 가짜 데이터 (Mock Data) - 백엔드에서 받을 예상 데이터
  const MOCK_RESPONSE = {
    title: "변치 않는 마음, 새로운 시작",
    color_theme: "순수함과 진실된 마음을 담은 희망의 색감",
    flowers: [
      {
        role: "메인",
        name: "하얀 튤립",
        reason: "헤어진 연인에게 새로운 시작을 제안하고 용서를 구하는 진심을 전달하기에 가장 적합합니다."
      },
      {
        role: "서브",
        name: "리시안셔스",
        reason: "이별 후에도 변치 않는 사랑과 우아한 마음을 전하고 싶은 고객님의 깊은 마음을 표현합니다."
      },
      {
        role: "소재",
        name: "안개꽃",
        reason: "맑고 순수한 마음으로 사랑의 성공을 다시 기원하며, 두 꽃을 더욱 풍성하게 감싸줍니다."
      }
    ],
    letter: "당신에게 진심으로 용서를 구합니다. 제 마음은 변함없이 당신을 향하고 있어요. 맑고 순수한 마음으로, 우리에게 새로운 시작과 사랑의 성공이 다시 찾아오기를 간절히 소망합니다.",
    care_guide: [
      "물을 매일 신선하게 갈아주어 꽃이 충분히 물을 흡수하도록 해주세요.",
      "서늘한 곳에 보관하고 직사광선을 피하면 더욱 오래 감상할 수 있습니다.",
      "줄기가 약한 꽃들이 있으니 조심스럽게 다루고, 시든 잎은 바로 제거해주세요."
    ]
  };

  // 스크롤 자동 내리기
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송 핸들러
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. 유저 메시지 추가
    const userMessage = { id: Date.now(), sender: 'user', type: 'text', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 2. (가짜) AI 응답 대기 시뮬레이션
    setTimeout(() => {
      // 3. 봇의 추천 카드 메시지 추가
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'recommendation', // 타입이 'recommendation'이면 카드를 보여줌
        data: MOCK_RESPONSE
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500); // 1.5초 뒤에 응답
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
                      {msg.data.flowers.map((flower, idx) => (
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
                      {msg.data.care_guide.map((guide, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-green-500">•</span>
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 버튼 영역 */}
                  <button className="w-full bg-pink-500 text-white py-2 rounded-xl font-bold text-sm hover:bg-pink-600 transition shadow-sm mt-2">
                    이 구성으로 주문하기
                  </button>
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
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
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