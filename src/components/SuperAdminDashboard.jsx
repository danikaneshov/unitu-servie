import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, setDoc, doc, query, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';

// Firebase Auth REST API key for creating users without logging out current user
const FIREBASE_API_KEY = "AIzaSyDH1sVswERvfGMgYDnYA-elfJanHETHV_4";

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'admin' });
  const [newOutlet, setNewOutlet] = useState({ name: '', slug: '', ownerUid: '', address: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingOutlet, setIsCreatingOutlet] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOutlets = onSnapshot(collection(db, 'outlets'), (snap) => {
      setOutlets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubUsers(); unsubOutlets(); };
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      // 1. Create auth user via REST API to avoid logging out superadmin
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          returnSecureToken: false
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error.message || 'Error creating user in Firebase Auth');
      }

      const uid = data.localId;

      // 2. Create user document in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString()
      });

      setNewUser({ email: '', password: '', role: 'admin' });
      alert('Пользователь успешно создан!');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    if (!newOutlet.ownerUid) return alert('Выберите владельца');
    if (!newOutlet.slug || !/^[a-z0-9-]+$/.test(newOutlet.slug)) {
      return alert('Slug должен содержать только строчные латинские буквы, цифры и дефис.');
    }

    const userOutlets = outlets.filter(o => o.ownerUid === newOutlet.ownerUid);
    if (userOutlets.length >= 2) {
      return alert('Этот пользователь уже достиг лимита в 2 точки.');
    }

    setIsCreatingOutlet(true);
    try {
      await addDoc(collection(db, 'outlets'), {
        ownerUid: newOutlet.ownerUid,
        slug: newOutlet.slug,
        name: newOutlet.name,
        address: newOutlet.address,
        createdAt: new Date().toISOString(),
        settings: {
          baseSalary: 3000,
          partnerBaseSalary: 1500,
          itemCommission: 1500,
          partnerItemCommission: 1500
        }
      });
      setNewOutlet({ name: '', slug: '', ownerUid: '', address: '' });
      alert('Точка успешно создана!');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setIsCreatingOutlet(false);
    }
  };

  const runMigration = async () => {
    if (!window.confirm('ВНИМАНИЕ! Эта операция привяжет все старые данные к выбранной точке. Продолжить?')) return;
    
    const outletId = prompt('Введите ID точки, к которой нужно привязать старые данные:');
    if (!outletId) return;

    try {
      const collectionsToMigrate = ['employees', 'sales', 'inventory_movements', 'inventory_templates'];
      
      for (const collName of collectionsToMigrate) {
        const snap = await getDocs(collection(db, collName));
        for (const document of snap.docs) {
          const data = document.data();
          if (!data.outletId) {
            await updateDoc(doc(db, collName, document.id), { outletId });
          }
        }
      }
      alert('Миграция успешно завершена!');
    } catch (err) {
      alert('Ошибка миграции: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400 font-bold animate-pulse">Инициализация систем...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] p-4 lg:p-8 font-sans selection:bg-blue-500/30 text-slate-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] backdrop-blur-xl p-6 lg:p-8 rounded-[32px] border border-white/[0.05] shadow-2xl">
          <div className="mb-6 md:mb-0">
            <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full mb-3 border border-blue-500/20">System Access</div>
            <h1 className="text-4xl font-black text-white tracking-tight">Unitu<span className="text-blue-500">.</span> Nexus</h1>
            <p className="text-slate-400 mt-2 font-medium">Центр управления франшизами</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={runMigration}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-amber-400 border border-amber-500/20 rounded-2xl font-bold transition-all hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            >
              DB Migrate
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="flex-1 md:flex-none px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl font-bold transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <div className="bg-white/[0.02] backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-8">Создать пользователя</h2>
            <form onSubmit={handleCreateUser} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input 
                  type="email" 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="admin@unitu.kz"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Пароль</label>
                <input 
                  type="password" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Роль</label>
                <select 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                >
                  <option value="admin" className="bg-slate-900">Владелец точки (Admin)</option>
                  <option value="superadmin" className="bg-slate-900">Супер Админ</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isCreatingUser}
                className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isCreatingUser ? 'Инициализация...' : 'Зарегистрировать'}
              </button>
            </form>
          </div>

          {/* Create Outlet Form */}
          <div className="bg-white/[0.02] backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-8">Развернуть точку</h2>
            <form onSubmit={handleCreateOutlet} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Владелец</label>
                <select 
                  value={newOutlet.ownerUid} 
                  onChange={e => setNewOutlet({...newOutlet, ownerUid: e.target.value})}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                  required
                >
                  <option value="" className="bg-slate-900">Выберите владельца</option>
                  {users.filter(u => u.role === 'admin').map(u => (
                    <option key={u.id} value={u.uid} className="bg-slate-900">{u.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Название</label>
                  <input 
                    type="text" 
                    value={newOutlet.name} 
                    onChange={e => setNewOutlet({...newOutlet, name: e.target.value})}
                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="My Lounge"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL Slug</label>
                  <input 
                    type="text" 
                    value={newOutlet.slug} 
                    onChange={e => setNewOutlet({...newOutlet, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="my-lounge"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Адрес (Опц.)</label>
                <input 
                  type="text" 
                  value={newOutlet.address} 
                  onChange={e => setNewOutlet({...newOutlet, address: e.target.value})}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  placeholder="г. Алматы"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCreatingOutlet}
                className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isCreatingOutlet ? 'Создание...' : 'Запустить точку'}
              </button>
            </form>
          </div>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/[0.02] backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.05] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
              База пользователей
            </h2>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-5 border border-white/[0.05] rounded-2xl bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-black/40 transition-colors">
                  <div>
                    <p className="font-bold text-white">{u.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full ${u.role === 'superadmin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{u.uid.substring(0, 10)}...</div>
                </div>
              ))}
              {users.length === 0 && <p className="text-slate-500 text-center py-10 font-medium">База пуста</p>}
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.05] shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
              Активные точки
            </h2>
            <div className="space-y-3">
              {outlets.map(o => {
                const owner = users.find(u => u.uid === o.ownerUid);
                return (
                  <div key={o.id} className="p-5 border border-white/[0.05] rounded-2xl bg-black/20 hover:bg-black/40 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white text-lg">{o.name}</h3>
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold tracking-wide">
                        /{o.slug}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        {owner ? owner.email : 'Владелец не найден'}
                      </p>
                      {o.address && (
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span>
                          {o.address}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {outlets.length === 0 && <p className="text-slate-500 text-center py-10 font-medium">Нет активных точек</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
