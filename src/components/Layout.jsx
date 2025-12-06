import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Flower, User, Menu, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    setIsLoggedIn(!!user);
    setIsMenuOpen(false);
  }, [location]);

  const handleUserClick = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate('/mypage');
    } else {
      navigate('/login');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col font-sans text-gray-800 relative">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
          
          {/* 왼쪽: 로고 */}
          <Link to="/" className="flex items-center gap-2 z-10">
            <Flower className="text-pink-500 w-8 h-8" />
            <span className="text-xl font-bold text-pink-600 tracking-tight hidden sm:block">FloMe</span>
          </Link>

          {/* 가운데: 메뉴 버튼 */}
          <button 
            onClick={toggleMenu}
            className="absolute left-1/2 transform -translate-x-1/2 p-2 rounded-full hover:bg-gray-100 transition z-10"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          {/* 오른쪽: 마이페이지 (지도 아이콘 삭제됨) */}
          <nav className="flex gap-2 z-10">
            <button 
              onClick={handleUserClick}
              className={`p-2 rounded-full transition ${isLoggedIn ? 'text-pink-500 bg-pink-50' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-500'}`}
            >
              <User className="w-6 h-6" />
            </button>
          </nav>
        </div>

        {/* 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-lg animate-in slide-in-from-top-2 z-0">
            <div className="max-w-md mx-auto p-4 flex gap-4 justify-center">
              <Link 
                to="/products" 
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-pink-50 transition border border-gray-100 group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                  <ShoppingBag className="w-6 h-6 text-gray-600 group-hover:text-pink-500" />
                </div>
                <span className="text-sm font-bold text-gray-600 group-hover:text-pink-500">전체 상품</span>
              </Link>

              <Link 
                to="/chat" 
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-pink-50 transition border border-gray-100 group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition">
                  <Sparkles className="w-6 h-6 text-pink-500" />
                </div>
                <span className="text-sm font-bold text-gray-600 group-hover:text-pink-500">AI 꽃 추천</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-md mx-auto w-full bg-white shadow-xl min-h-screen">
        <Outlet />
      </main>

      <footer className="bg-gray-100 py-6 text-center text-xs text-gray-400">
        <p>© 2025 FloMe. All rights reserved.</p>
        <Link to="/admin" className="mt-2 inline-block hover:text-gray-600">점주 관리자 모드</Link>
      </footer>
    </div>
  );
};

export default Layout;