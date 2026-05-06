import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="mb-8">
          <span className="text-4xl font-black tracking-tighter text-slate-900">Unitu<span className="text-primary">.</span></span>
          <p className="text-slate-500 mt-2">Единая система управления</p>
        </div>
        
        <p className="text-slate-600 mb-8 font-medium">Пожалуйста, перейдите по уникальной ссылке вашей компании или войдите в панель управления.</p>
        
        <button 
          onClick={() => navigate('/admin/login')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors"
        >
          Войти как Владелец
        </button>
      </div>
    </div>
  );
};

export default Landing;
