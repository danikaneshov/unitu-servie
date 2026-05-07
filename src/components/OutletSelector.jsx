import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Store, LogOut, ArrowRight, MapPin, Loader2 } from 'lucide-react';

const OutletSelector = () => {
  const navigate = useNavigate();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubOutlets = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous outlets listener when auth state changes
      if (unsubOutlets) { unsubOutlets(); unsubOutlets = null; }
      if (!user) {
        navigate('/admin/login');
        return;
      }
      const q = query(collection(db, 'outlets'), where('ownerUid', '==', user.uid));
      unsubOutlets = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOutlets(list);
        setLoading(false);
        if (list.length === 1) {
          navigate('/' + list[0].slug + '/admin');
        }
      });
    });
    return () => {
      unsubAuth();
      if (unsubOutlets) unsubOutlets();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="text-5xl font-black tracking-tighter text-slate-900">
              Unitu<span className="text-blue-600">.</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Выберите точку</h1>
          <p className="text-slate-500 text-sm">У вас несколько точек. Выберите, какой управлять.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => navigate('/' + outlet.slug + '/admin')}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-300 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                  {outlet.name ? outlet.name.charAt(0).toUpperCase() : '?'}
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{outlet.name || 'Без названия'}</h3>
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-400 font-mono">
                  <Store size={14} /> /{outlet.slug}
                </span>
                {outlet.address && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                    <MapPin size={14} /> {outlet.address}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => signOut(auth)}
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-red-500 font-medium transition-colors"
          >
            <LogOut size={18} /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutletSelector;