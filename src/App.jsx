import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Result from './pages/Result';
import Login from './pages/Login';
import Admin from './pages/Admin';
import MyPage from './pages/MyPage';
import ProductList from './pages/ProductList';
import StoreDetail from './pages/StoreDetail';
import Cart from './pages/Cart';
import ReviewList from './pages/ReviewList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/result" element={<Result />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/store/:id/reviews" element={<ReviewList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;