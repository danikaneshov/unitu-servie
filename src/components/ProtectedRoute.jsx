import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const MIN_LOADING_MS = 2200; // Минимальное время показа оверлея, чтобы данные БД успели подтянуться

// Общий оверлей — прозрачный блюр + синяя полоска загрузки сверху
const LoadingOverlay = ({ fading }) => (
  <>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    />
    {/* Синяя полоса загрузки сверху */}
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 10000,
        overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '40%',
          background: 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)',
          borderRadius: '2px',
          animation: 'loadingBar 1.4s ease-in-out infinite',
        }}
      />
    </div>
    <style>{`
      @keyframes loadingBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
    `}</style>
  </>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayFading, setOverlayFading] = useState(false);
  const loadStartRef = useRef(Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // Default to admin if no doc exists yet (or handle otherwise)
            setUserData({ role: 'admin' });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUserData({ role: 'admin' });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authResolved) return;

    const elapsed = Date.now() - loadStartRef.current;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);

    const timer = setTimeout(() => {
      setOverlayFading(true);
      setTimeout(() => setOverlayVisible(false), 500);
    }, remaining);

    return () => clearTimeout(timer);
  }, [authResolved]);

  if (!authResolved) {
    return <LoadingOverlay fading={false} />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check roles if specified
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    if (userData.role === 'superadmin') {
      return <Navigate to="/superadmin" replace />;
    } else {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return (
    <>
      {children}
      {overlayVisible && <LoadingOverlay fading={overlayFading} />}
    </>
  );
};

export default ProtectedRoute;