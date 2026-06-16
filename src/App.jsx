import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toast, Icon } from './ds';
import AppShell from './screens/AppShell.jsx';
import Home from './screens/Home.jsx';
import AuctionLive from './screens/AuctionLive.jsx';
import Checkout from './screens/Checkout.jsx';
import SellerDashboard from './screens/SellerDashboard.jsx';
import MyOrders from './screens/MyOrders.jsx';
import Notifications from './screens/Notifications.jsx';
import ListingDetail from './screens/ListingDetail.jsx';
import Auth from './screens/Auth.jsx';
import SellerProfile from './screens/SellerProfile.jsx';
import Review from './screens/Review.jsx';
import CreateListing from './screens/CreateListing.jsx';
import CreateAuction from './screens/CreateAuction.jsx';
import Admin from './screens/Admin.jsx';
import DniVerify from './screens/DniVerify.jsx';

export default function App() {
  const navigate = useNavigate();
  const [verified, setVerified] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const ttRef = React.useRef();

  const showToast = (t) => {
    setToast(t);
    clearTimeout(ttRef.current);
    ttRef.current = setTimeout(() => setToast(null), 4200);
  };
  const verifyIdentity = () => {
    setVerified(true);
    showToast({ tone: 'success', title: 'Identidad verificada', message: 'Ya podés pujar y comprar en Yala.', icon: 'Shield' });
  };

  const navDest = { home: '/', seller: '/seller', notifications: '/notifications', profile: '/seller/marco' };

  return (
    <>
      <AppShell onNav={(d) => navigate(navDest[d] || '/')} onCat={() => navigate('/')} unread={3} />
      <div style={{ minHeight: 'calc(100vh - 112px)', paddingBottom: 80 }}>
        <Routes>
          <Route path="/" element={<Home onOpenAuction={(id) => navigate('/auction/' + id)} onOpenListing={(id) => navigate('/listing/' + id)} />} />
          <Route path="/auction/:id" element={<AuctionLive verified={verified} onRequireDni={() => navigate('/verify-dni')} onBack={() => navigate('/')} />} />
          <Route path="/listing/:id" element={<ListingDetail verified={verified} onRequireDni={() => navigate('/verify-dni')} onBuy={() => navigate('/checkout')} onBack={() => navigate('/')} onOpenSeller={() => navigate('/seller/marco')} />} />
          <Route path="/checkout" element={<Checkout role="buyer" onBack={() => navigate('/orders')} />} />
          <Route path="/orders" element={<MyOrders onOpenOrder={(id) => (id === 'home' ? navigate('/') : navigate('/checkout'))} />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/seller" element={<SellerDashboard onNew={() => navigate('/seller/new-listing')} onOpenAuction={(id) => navigate('/auction/' + id)} onOpenOrder={() => navigate('/checkout')} />} />
          <Route path="/seller/new-listing" element={<CreateListing onBack={() => navigate('/seller')} onCreate={() => { showToast({ tone: 'success', title: 'Publicación creada', message: 'Tu publicación ya está activa en el marketplace.', icon: 'Check' }); navigate('/seller'); }} />} />
          <Route path="/seller/new-auction" element={<CreateAuction onBack={() => navigate('/seller')} onCreate={() => { showToast({ tone: 'success', title: 'Subasta creada', message: 'La subasta arranca según lo que programaste.', icon: 'Gavel' }); navigate('/seller'); }} />} />
          <Route path="/seller/:id" element={<SellerProfile onBack={() => navigate(-1)} onOpenListing={(id) => navigate('/listing/' + id)} />} />
          <Route path="/login" element={<Auth onAuth={() => navigate('/')} />} />
          <Route path="/review/:orderId" element={<Review onBack={() => navigate('/orders')} onSubmit={() => { showToast({ tone: 'success', title: 'Reseña publicada', message: 'Gracias por calificar tu experiencia.', icon: 'Star' }); navigate('/orders'); }} />} />
          <Route path="/verify-dni" element={<DniVerify onVerify={() => { verifyIdentity(); navigate(-1); }} onBack={() => navigate(-1)} />} />
          <Route path="/admin" element={<Admin onAction={(message) => showToast({ tone: 'success', title: 'Listo', message, icon: 'Check' })} />} />
          <Route path="*" element={<div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}><h2 style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-sans)' }}>Página no encontrada</h2></div>} />
        </Routes>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 78, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Toast tone={toast.tone} title={toast.title} message={toast.message}
            icon={toast.icon && Icon[toast.icon] ? React.createElement(Icon[toast.icon], { size: 16 }) : null}
            onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}
