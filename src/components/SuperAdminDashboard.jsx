import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, addDoc, setDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth, FIREBASE_API_KEY } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Database, Plus, Shield, Store, Users, Copy, Check, ExternalLink, UserPlus, Building, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-5 border border-slate-100 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  </Card>
);

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'admin' });
  const [newOutlet, setNewOutlet] = useState({ name: '', slug: '', ownerUid: '', address: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingOutlet, setIsCreatingOutlet] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, 'users'),
      (s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => {
        console.error(e);
        setError(`Ошибка загрузки: ${e.message}`);
      }
    );
    const u2 = onSnapshot(
      collection(db, 'outlets'),
      (s) => {
        setOutlets(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setError(`Ошибка загрузки: ${e.message}`);
      }
    );

    return () => {
      u1();
      u2();
    };
  }, []);

  const adminUsers = useMemo(() => users.filter((u) => u.role === 'admin'), [users]);
  const superAdminsCount = useMemo(() => users.filter((u) => u.role === 'superadmin').length, [users]);

  const handleCreateUser = async (ev) => {
    ev.preventDefault();
    setIsCreatingUser(true);
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, password: newUser.password, returnSecureToken: false })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Ошибка');
      await setDoc(doc(db, 'users', data.localId), {
        uid: data.localId,
        email: newUser.email,
        role: newUser.role,
        createdAt: new Date().toISOString()
      });
      setNewUser({ email: '', password: '', role: 'admin' });
      alert('Пользователь создан');
    } catch (e) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateOutlet = async (ev) => {
    ev.preventDefault();
    if (!newOutlet.ownerUid) return alert('Выберите владельца');
    if (!/^[a-z0-9-]+$/.test(newOutlet.slug)) return alert('Slug: только латиница, цифры и дефис');
    if (outlets.filter((o) => o.ownerUid === newOutlet.ownerUid).length >= 2) return alert('Лимит: 2 точки');

    setIsCreatingOutlet(true);
    try {
      await addDoc(collection(db, 'outlets'), {
        ownerUid: newOutlet.ownerUid,
        slug: newOutlet.slug,
        name: newOutlet.name,
        address: newOutlet.address,
        createdAt: new Date().toISOString(),
        settings: { baseSalary: 3000, partnerBaseSalary: 1500, itemCommission: 1500, partnerItemCommission: 1500 }
      });
      setNewOutlet({ name: '', slug: '', ownerUid: '', address: '' });
      alert('Точка создана');
    } catch (e) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setIsCreatingOutlet(false);
    }
  };

  const runMigration = async () => {
    if (!window.confirm('Привязать старые данные к точке?')) return;
    const oid = prompt('ID точки:');
    if (!oid) return;

    try {
      const cols = ['employees', 'sales', 'inventory_movements', 'inventory_templates'];
      for (const colName of cols) {
        const snap = await getDocs(collection(db, colName));
        await Promise.all(
          snap.docs.map((ds) => {
            if (ds.data().outletId) return Promise.resolve();
            return updateDoc(doc(db, colName, ds.id), { outletId: oid });
          })
        );
      }
      alert('Миграция завершена');
    } catch (e) {
      alert(`Ошибка: ${e.message}`);
    }
  };

  const baseUrl = `${window.location.origin}/`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
          onClick={() => {
            setError(null);
            setLoading(true);
            setTimeout(() => setLoading(false), 100);
          }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Unitu<span className="text-blue-600">.</span>
              <span className="text-slate-400 font-medium text-lg ml-2">Super Admin</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all"
              onClick={runMigration}
            >
              <Database size={16} /> Миграция
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
              onClick={() => signOut(auth)}
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Пользователи" value={users.length} color="bg-blue-100 text-blue-600" />
          <StatCard icon={Store} label="Точки" value={outlets.length} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={Shield} label="Суперадмины" value={superAdminsCount} color="bg-amber-100 text-amber-600" />
          <StatCard icon={Building} label="Владельцы" value={adminUsers.length} color="bg-emerald-100 text-emerald-600" />
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-8 w-fit">
          {[
            { key: 'overview', icon: Store, label: 'Обзор' },
            { key: 'users', icon: UserPlus, label: 'Пользователи' },
            { key: 'outlets', icon: Building, label: 'Точки' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeSection === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 lg:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Новый пользователь</h2>
              </div>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <input type="email" placeholder="email@example.com" required value={newUser.email} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" onChange={(ev) => setNewUser({ ...newUser, email: ev.target.value })} />
                <input type="password" placeholder="Пароль" required value={newUser.password} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" onChange={(ev) => setNewUser({ ...newUser, password: ev.target.value })} />
                <select value={newUser.role} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm appearance-none" onChange={(ev) => setNewUser({ ...newUser, role: ev.target.value })}>
                  <option value="admin">Владелец точки</option>
                  <option value="superadmin">Суперадмин</option>
                </select>
                <button type="submit" disabled={isCreatingUser} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {isCreatingUser ? 'Создание...' : 'Зарегистрировать'}
                </button>
              </form>
            </Card>

            <Card className="p-6 lg:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Plus size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Новая точка</h2>
              </div>
              <form className="space-y-4" onSubmit={handleCreateOutlet}>
                <select required value={newOutlet.ownerUid} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm appearance-none" onChange={(ev) => setNewOutlet({ ...newOutlet, ownerUid: ev.target.value })}>
                  <option value="">Выберите владельца</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.uid || u.id}>{u.email}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Название" required value={newOutlet.name} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" onChange={(ev) => setNewOutlet({ ...newOutlet, name: ev.target.value })} />
                  <input type="text" placeholder="slug" required value={newOutlet.slug} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" onChange={(ev) => setNewOutlet({ ...newOutlet, slug: ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                </div>
                <input type="text" placeholder="Адрес (необязательно)" value={newOutlet.address} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" onChange={(ev) => setNewOutlet({ ...newOutlet, address: ev.target.value })} />
                <button type="submit" disabled={isCreatingOutlet} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  {isCreatingOutlet ? 'Создание...' : 'Запустить точку'}
                </button>
              </form>
            </Card>
          </div>
        )}

        {activeSection === 'users' && (
          <Card className="border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Все пользователи</h2>
              <span className="text-xs text-slate-500 font-mono">{users.length} аккаунтов</span>
            </div>
            <div className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <p className="text-slate-500 text-center py-16">Нет пользователей</p>
              ) : users.map((u) => {
                const outletCount = outlets.filter((o) => o.ownerUid === (u.uid || u.id)).length;
                return (
                  <div key={u.id} className="p-5 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${u.role === 'superadmin' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.email ? u.email[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{u.email || 'Без email'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${u.role === 'superadmin' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                          {u.role === 'superadmin' ? 'Суперадмин' : 'Владелец'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg">{(u.uid || u.id).substring(0, 12)}</span>
                      {outletCount > 0 && <span className="text-xs text-slate-500">{outletCount} точек</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeSection === 'outlets' && (
          <Card className="border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Все точки</h2>
              <span className="text-xs text-slate-500 font-mono">{outlets.length} активных</span>
            </div>
            <div className="divide-y divide-slate-100">
              {outlets.length === 0 ? (
                <p className="text-slate-500 text-center py-16">Нет активных точек</p>
              ) : outlets.map((o) => {
                const owner = users.find((u) => (u.uid || u.id) === o.ownerUid);
                const url = `${baseUrl}${o.slug}`;
                return (
                  <div key={o.id} className="p-5 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                        {o.name ? o.name[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{o.name || 'Без названия'}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full">/{o.slug}</span>
                          {o.address && <span className="text-xs text-slate-500 truncate max-w-[200px]">{o.address}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{owner ? owner.email : 'Нет владельца'}</span>
                      <button
                        title={url}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg text-xs font-medium transition-all"
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          setCopiedSlug(o.id);
                          setTimeout(() => setCopiedSlug(null), 1500);
                        }}
                      >
                        {copiedSlug === o.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span className="hidden sm:inline truncate max-w-[140px]">{o.slug}</span>
                      </button>
                      <a className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all" href={url} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
