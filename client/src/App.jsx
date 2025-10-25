import React, { useState, useEffect } from 'react';
import { Camera, Award, Trophy, Users, Mail, Settings, LogOut, Edit, Trash, Check, X, Search, Crown, Star, Menu, ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// const API_URL = 'http://localhost:3000/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function LoyaltyProgram() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSection, setCurrentSection] = useState('rewards');
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [colors, setColors] = useState({ primary_color: '#9333ea', secondary_color: '#f3e8ff' });
  const [banner, setBanner] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadColors();
    loadBanner();
    loadRewards();
    loadRanking();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadRewards();
      if (currentSection === 'account') loadMySubmissions();
    }
  }, [currentUser, currentSection]);

  useEffect(() => {
    if (colors.primary_color) document.documentElement.style.setProperty('--primary', colors.primary_color);
    if (colors.secondary_color) document.documentElement.style.setProperty('--secondary', colors.secondary_color);
  }, [colors]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) setCurrentUser(JSON.parse(user));
  };

  const loadColors = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/colors`);
      const data = await res.json();
      if (data.primary_color) setColors(data);
    } catch (err) {
      console.error('Error loading colors:', err);
    }
  };

  const loadBanner = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/banner`);
      const data = await res.json();
      setBanner(data);
    } catch (err) {
      console.error('Error loading banner:', err);
    }
  };

  const loadRewards = async () => {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/rewards`, { headers });
      const data = await res.json();
      setRewards(data);
    } catch (err) {
      console.error('Error loading rewards:', err);
    }
  };

  const loadRanking = async () => {
    try {
      const res = await fetch(`${API_URL}/ranking`);
      const data = await res.json();
      setRanking(data);
    } catch (err) {
      console.error('Error loading ranking:', err);
    }
  };

  const loadMySubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentSection('rewards');
    setMobileMenuOpen(false);
  };

  const navigateTo = (section) => {
    setCurrentSection(section);
    setSelectedReward(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">MADERISTAS</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-purple-100">
              <Menu className="w-6 h-6 text-purple-600" />
            </button>
            <div className="hidden md:flex gap-4 items-center">
              <button onClick={() => navigateTo('rewards')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                <Trophy className="w-5 h-5" /> Recompensas
              </button>
              <button onClick={() => navigateTo('ranking')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                <Users className="w-5 h-5" /> Ranking
              </button>
              {currentUser ? (
                <>
                  <button onClick={() => navigateTo('account')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                    <Camera className="w-5 h-5" /> Mi Cuenta
                  </button>
                  <button onClick={() => navigateTo('contact')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                    <Mail className="w-5 h-5" /> Contacto
                  </button>
                  {currentUser.is_admin && (
                    <button onClick={() => navigateTo('admin')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                      <Settings className="w-5 h-5" /> Admin
                    </button>
                  )}
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition text-red-600">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button onClick={() => navigateTo('login')} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700">
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-2">
              <button onClick={() => navigateTo('rewards')} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                <Trophy className="w-5 h-5" /> Recompensas
              </button>
              <button onClick={() => navigateTo('ranking')} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                <Users className="w-5 h-5" /> Ranking
              </button>
              {currentUser ? (
                <>
                  <button onClick={() => navigateTo('account')} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                    <Camera className="w-5 h-5" /> Mi Cuenta
                  </button>
                  <button onClick={() => navigateTo('contact')} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                    <Mail className="w-5 h-5" /> Contacto
                  </button>
                  {currentUser.is_admin && (
                    <button onClick={() => navigateTo('admin')} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                      <Settings className="w-5 h-5" /> Admin
                    </button>
                  )}
                  <button onClick={logout} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-100 transition text-red-600">
                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <button onClick={() => navigateTo('login')} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700">
                  Iniciar Sesión
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentSection === 'login' && <AuthSection setCurrentUser={setCurrentUser} setCurrentSection={setCurrentSection} />}
        {currentSection === 'rewards' && !selectedReward && <RewardsSection rewards={rewards} banner={banner} currentUser={currentUser} setSelectedReward={setSelectedReward} />}
        {currentSection === 'rewards' && selectedReward && <RewardDetailSection reward={selectedReward} setSelectedReward={setSelectedReward} currentUser={currentUser} loadRewards={loadRewards} navigateTo={navigateTo} />}
        {currentSection === 'ranking' && <RankingSection ranking={ranking} currentUser={currentUser} />}
        {currentSection === 'account' && currentUser && <AccountSection currentUser={currentUser} submissions={submissions} ranking={ranking} />}
        {currentSection === 'contact' && currentUser && <ContactSection />}
        {currentSection === 'admin' && currentUser?.is_admin && <AdminSection colors={colors} setColors={setColors} loadColors={loadColors} loadRewards={loadRewards} loadBanner={loadBanner} />}
      </div>
    </div>
  );
}

function AuthSection({ setCurrentUser, setCurrentSection }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({});
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setCurrentSection('rewards');
      } else {
        const form = new FormData();
        Object.keys(formData).forEach(key => form.append(key, formData[key]));
        if (photo) form.append('photo', photo);
        const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Usuario</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Foto de Perfil (opcional)</label>
                <input type="file" accept="image/*" className="w-full px-4 py-2 border rounded-lg" onChange={(e) => setPhoto(e.target.files[0])} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <p className="text-center mt-4">{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}<button onClick={() => setIsLogin(!isLogin)} className="text-purple-600 font-semibold ml-2">{isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}</button></p>
      </div>
    </div>
  );
}

function RewardsSection({ rewards, banner, currentUser, setSelectedReward }) {
  return (
    <div>
      {banner && banner.image_path && (
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 cursor-pointer shadow-xl" onClick={() => banner.url && window.open(banner.url, '_blank')}>
          <img src={`http://localhost:3000${banner.image_path}`} alt="Banner" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <h2 className="text-3xl font-bold mb-6 text-purple-600">Recompensas Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map(reward => (
          <div key={reward.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer" onClick={() => setSelectedReward(reward)}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-purple-600 flex-1">{reward.title}</h3>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full font-bold text-sm ml-2">{reward.points} pts</span>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-line">{reward.description}</p>
            {currentUser && reward.userStatus && (
              <div className="mb-3">
                {reward.userStatus === 'pending' && (
                  <div className="flex items-center gap-2 text-yellow-700 bg-yellow-100 p-2 rounded-lg"><Clock className="w-4 h-4" /><span className="text-sm font-semibold">Pendiente</span></div>
                )}
                {reward.userStatus === 'approved' && reward.redeem_type === 'once' && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded-lg"><CheckCircle className="w-4 h-4" /><span className="text-sm font-semibold">Completado</span></div>
                )}
                {reward.userStatus === 'rejected' && (
                  <div className="flex items-center gap-2 text-red-700 bg-red-100 p-2 rounded-lg"><AlertCircle className="w-4 h-4" /><span className="text-sm font-semibold">Rechazado</span></div>
                )}
              </div>
            )}
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition">Ver Detalle</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardDetailSection({ reward: initialReward, setSelectedReward, currentUser, loadRewards, navigateTo }) {
  const [reward, setReward] = useState(initialReward);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRewardDetail();
  }, []);

  const loadRewardDetail = async () => {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/rewards/${initialReward.id}`, { headers });
      const data = await res.json();
      setReward(data);
    } catch (err) {
      console.error('Error loading reward detail:', err);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor selecciona un archivo');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('reward_id', reward.id);
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('¡Evidencia enviada! Espera la validación del administrador.');
      setFile(null);
      setTimeout(() => {
        loadRewards();
        loadRewardDetail();
        setMessage('');
      }, 2000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setSelectedReward(null)} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold">
        <ArrowLeft className="w-5 h-5" /> Volver a recompensas
      </button>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-purple-600">{reward.title}</h2>
          <span className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-lg">{reward.points} pts</span>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Descripción</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reward.description}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Cómo Redimir</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reward.how_to_redeem}</p>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {reward.redeem_type === 'once' ? 'Se puede redimir solo una vez' : 'Se puede redimir múltiples veces'}
            </span>
          </div>
          {currentUser && reward.userStatus && (
            <div>
              {reward.userStatus === 'pending' && (
                <div className="flex items-center gap-3 text-yellow-700 bg-yellow-100 p-4 rounded-lg">
                  <Clock className="w-6 h-6" />
                  <div><p className="font-bold">Pendiente de Aprobación</p><p className="text-sm">Tu evidencia está siendo revisada</p></div>
                </div>
              )}
              {reward.userStatus === 'approved' && reward.redeem_type === 'once' && (
                <div className="flex items-center gap-3 text-green-700 bg-green-100 p-4 rounded-lg">
                  <CheckCircle className="w-6 h-6" />
                  <div><p className="font-bold">¡Completado!</p><p className="text-sm">Ya redimiste esta recompensa</p></div>
                </div>
              )}
              {reward.userStatus === 'rejected' && (
                <div className="flex items-center gap-3 text-red-700 bg-red-100 p-4 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                  <div><p className="font-bold">Rechazado</p><p className="text-sm">Puedes intentar de nuevo</p></div>
                </div>
              )}
            </div>
          )}
          {!currentUser ? (
            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg text-center">
              <p className="text-lg mb-4">Debes iniciar sesión para redimir esta recompensa</p>
              <button onClick={() => navigateTo('login')} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">Iniciar Sesión</button>
            </div>
          ) : reward.canRedeem ? (
            <div className="border-2 border-purple-200 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Enviar Evidencia</h3>
              {message && (
                <div className={`p-3 rounded-lg mb-4 ${message.includes('Error') || message.includes('selecciona') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>
              )}
              <form onSubmit={handleRedeem}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Subir Evidencia</label>
                  <input type="file" accept="image/*,application/pdf" required className="w-full px-4 py-2 border rounded-lg" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50">
                  {loading ? 'Enviando...' : 'Enviar Evidencia'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RankingSection({ ranking, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredRanking = ranking.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-6 text-purple-600">Ranking de Usuarios</h2>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Buscar usuario..." className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        {filteredRanking.map((user) => (
          <div key={user.id} className={`flex items-center p-4 rounded-lg transition ${
            user.position === 1 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-500' :
            user.position <= 10 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-gray-50 hover:bg-gray-100'
          } ${currentUser && user.id === currentUser.id ? 'ring-2 ring-purple-500' : ''}`}>
            <div className="text-2xl font-bold text-purple-600 w-16 relative">
              {user.position === 1 && <Crown className="absolute -top-3 left-0 text-yellow-500 w-6 h-6" />}
              #{user.position}
            </div>
            <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center overflow-hidden mr-4">
              {user.photo ? (
                <img src={`http://localhost:3000${user.photo}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-purple-600">{user.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">{user.username}</div>
              <div className="text-sm text-gray-600">{user.name}</div>
            </div>
            <div className="flex items-center gap-2">
              {user.position <= 10 && <Star className="text-yellow-500 w-5 h-5" />}
              <span className="text-2xl font-bold text-purple-600">{user.points} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountSection({ currentUser, submissions, ranking }) {
  const userPosition = ranking.findIndex(u => u.id === currentUser.id) + 1;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-8">
          <div className="text-5xl font-bold mb-2">{currentUser.points}</div>
          <div className="text-xl opacity-90">Puntos Totales</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-8">
          <div className="text-5xl font-bold mb-2">#{userPosition || '-'}</div>
          <div className="text-xl opacity-90">Posición en Ranking</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h3 className="text-2xl font-bold mb-4 text-purple-600">Información de Cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-600">Usuario</label><p className="text-lg font-semibold">{currentUser.username}</p></div>
          <div><label className="block text-sm font-medium text-gray-600">Nombre</label><p className="text-lg font-semibold">{currentUser.name}</p></div>
          <div><label className="block text-sm font-medium text-gray-600">Email</label><p className="text-lg font-semibold">{currentUser.email}</p></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold mb-4 text-purple-600">Mis Envíos</h3>
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No has enviado ninguna evidencia aún</p>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="border-2 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{sub.reward_title}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sub.status === 'pending' ? 'Pendiente' : sub.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">Enviado: {new Date(sub.created_at).toLocaleDateString('es-MX')}</p>
                {sub.status === 'approved' && <p className="text-green-600 font-semibold">+{sub.points} puntos obtenidos</p>}
                {sub.status === 'rejected' && sub.rejection_reason && (
                  <div className="bg-red-50 p-3 rounded-lg mt-2"><p className="text-sm text-red-700"><strong>Razón:</strong> {sub.rejection_reason}</p></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState({ subject: '', type: 'incidencia', message: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Error al enviar mensaje');
      setMessage('Mensaje enviado exitosamente');
      setFormData({ subject: '', type: 'incidencia', message: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-purple-600">Contacto</h2>
      {message && <div className={`p-4 rounded-lg mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Asunto</label>
          <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tipo</label>
          <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
            <option value="incidencia">Incidencia</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Mensaje</label>
          <textarea required rows="5" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Enviar Mensaje</button>
      </form>
    </div>
  );
}

function AdminSection({ colors, setColors, loadColors, loadRewards, loadBanner }) {
  const [activeTab, setActiveTab] = useState('colors');

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-6 text-purple-600">Panel de Administrador</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['colors', 'banner', 'rewards', 'submissions', 'users', 'messages'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
            {tab === 'colors' ? 'Colores' : tab === 'banner' ? 'Banner' : tab === 'rewards' ? 'Recompensas' : tab === 'submissions' ? 'Validar Envíos' : tab === 'users' ? 'Usuarios' : 'Mensajes'}
          </button>
        ))}
      </div>
      {activeTab === 'colors' && <ColorsTab colors={colors} setColors={setColors} />}
      {activeTab === 'banner' && <BannerTab loadBanner={loadBanner} />}
      {activeTab === 'rewards' && <RewardsTab loadRewards={loadRewards} />}
      {activeTab === 'submissions' && <SubmissionsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'messages' && <MessagesTab />}
    </div>
  );
}

function ColorsTab({ colors, setColors }) {
  const [tempColors, setTempColors] = useState(colors);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(tempColors)
      });
      if (!res.ok) throw new Error('Error al guardar colores');
      setColors(tempColors);
      setMessage('Colores guardados exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Personalizar Colores</h3>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{message}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Color Principal</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={tempColors.primary_color || '#9333ea'} onChange={(e) => setTempColors({...tempColors, primary_color: e.target.value})} className="w-20 h-20 rounded-lg border-2 cursor-pointer" />
            <input type="text" value={tempColors.primary_color || '#9333ea'} onChange={(e) => setTempColors({...tempColors, primary_color: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Color Secundario</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={tempColors.secondary_color || '#f3e8ff'} onChange={(e) => setTempColors({...tempColors, secondary_color: e.target.value})} className="w-20 h-20 rounded-lg border-2 cursor-pointer" />
            <input type="text" value={tempColors.secondary_color || '#f3e8ff'} onChange={(e) => setTempColors({...tempColors, secondary_color: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
          </div>
        </div>
      </div>
      <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">Guardar Colores</button>
    </div>
  );
}

function BannerTab({ loadBanner }) {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    try {
      const formData = new FormData();
      if (image) formData.append('image', image);
      formData.append('url', url);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/settings/banner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Error al guardar banner');
      setMessage('Banner guardado exitosamente');
      loadBanner();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Banner Promocional</h3>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{message}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Imagen del Banner</label>
          <input type="file" accept="image/*" className="w-full px-4 py-2 border rounded-lg" onChange={(e) => setImage(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">URL de Redirección</label>
          <input type="url" placeholder="https://..." className="w-full px-4 py-2 border rounded-lg" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <button onClick={handleSave} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">Guardar Banner</button>
      </div>
    </div>
  );
}

function RewardsTab({ loadRewards }) {
  const [rewards, setRewards] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', how_to_redeem: '', points: '', redeem_type: 'unlimited' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRewardsList();
  }, []);

  const loadRewardsList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/rewards/admin/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRewards(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editId ? `${API_URL}/rewards/${editId}` : `${API_URL}/rewards`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Error al guardar recompensa');
      setMessage(editId ? 'Recompensa actualizada' : 'Recompensa creada');
      setFormData({ title: '', description: '', how_to_redeem: '', points: '', redeem_type: 'unlimited' });
      setEditId(null);
      loadRewardsList();
      loadRewards();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleEdit = (reward) => {
    setFormData({ title: reward.title, description: reward.description, how_to_redeem: reward.how_to_redeem, points: reward.points, redeem_type: reward.redeem_type || 'unlimited' });
    setEditId(reward.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta recompensa?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/rewards/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      loadRewardsList();
      loadRewards();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/rewards/${id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_suspended: !currentStatus })
      });
      loadRewardsList();
      loadRewards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{editId ? 'Editar' : 'Crear'} Recompensa</h3>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div><label className="block text-sm font-medium mb-2">Título</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
        <div><label className="block text-sm font-medium mb-2">Descripción (puedes usar saltos de línea)</label><textarea required rows="5" className="w-full px-4 py-2 border rounded-lg" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
        <div><label className="block text-sm font-medium mb-2">Cómo Redimir (puedes usar saltos de línea)</label><textarea required rows="5" className="w-full px-4 py-2 border rounded-lg" value={formData.how_to_redeem} onChange={(e) => setFormData({...formData, how_to_redeem: e.target.value})} /></div>
        <div><label className="block text-sm font-medium mb-2">Puntos</label><input type="number" min="1" required className="w-full px-4 py-2 border rounded-lg" value={formData.points} onChange={(e) => setFormData({...formData, points: e.target.value})} /></div>
        <div><label className="block text-sm font-medium mb-2">Tipo de Redención</label><select className="w-full px-4 py-2 border rounded-lg" value={formData.redeem_type} onChange={(e) => setFormData({...formData, redeem_type: e.target.value})}><option value="unlimited">Ilimitada</option><option value="once">Una sola vez</option></select></div>
        <div className="flex gap-3">
          <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">{editId ? 'Actualizar' : 'Crear'} Recompensa</button>
          {editId && <button type="button" onClick={() => { setFormData({ title: '', description: '', how_to_redeem: '', points: '', redeem_type: 'unlimited' }); setEditId(null); }} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>}
        </div>
      </form>
      <h3 className="text-xl font-bold mb-4">Recompensas Existentes</h3>
      <div className="space-y-3">
        {rewards.map(reward => (
          <div key={reward.id} className={`border-2 rounded-lg p-4 ${reward.is_suspended ? 'bg-gray-100 opacity-75' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">{reward.title}</h4>
                  {reward.is_suspended && <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">SUSPENDIDA</span>}
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{reward.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">{reward.points} puntos</span>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{reward.redeem_type === 'once' ? 'Una vez' : 'Ilimitada'}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleSuspend(reward.id, reward.is_suspended)} className={`p-2 ${reward.is_suspended ? 'bg-green-500' : 'bg-orange-500'} text-white rounded-lg hover:opacity-80`} title={reward.is_suspended ? 'Reactivar' : 'Suspender'}>
                  {reward.is_suspended ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <button onClick={() => handleEdit(reward)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Edit className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(reward.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions/pending`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions/${id}/approve`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al aprobar');
      setMessage('Envío aprobado exitosamente');
      loadSubmissions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Razón del rechazo:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Error al rechazar');
      setMessage('Envío rechazado');
      loadSubmissions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Validar Envíos Pendientes</h3>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{message}</div>}
      {submissions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay envíos pendientes</p>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="border-2 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg">{sub.reward_title}</h4>
                  <p className="text-sm text-gray-600">Usuario: {sub.username} ({sub.name})</p>
                  <p className="text-sm text-gray-600">Enviado: {new Date(sub.created_at).toLocaleString('es-MX')}</p>
                  <span className="inline-block mt-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">Vale {sub.points} puntos</span>
                </div>
              </div>
              <div className="mb-4"><a href={`http://localhost:3000${sub.file_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver archivo enviado →</a></div>
              <div className="flex gap-3">
                <button onClick={() => handleApprove(sub.id)} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600"><Check className="w-5 h-5" /> Aprobar</button>
                <button onClick={() => handleReject(sub.id)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600"><X className="w-5 h-5" /> Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Usuarios Registrados ({users.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-purple-100">
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Puntos</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{user.username}</td>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 font-bold text-purple-600">{user.points}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_admin ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{user.is_admin ? 'Admin' : 'Usuario'}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessagesTab() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/contact`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Mensajes de Contacto ({messages.length})</h3>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay mensajes</p>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className="border-2 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-lg">{msg.subject}</h4>
                  <p className="text-sm text-gray-600">De: {msg.username} ({msg.email})</p>
                  <p className="text-sm text-gray-600">Fecha: {new Date(msg.created_at).toLocaleString('es-MX')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${msg.type === 'incidencia' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{msg.type === 'incidencia' ? 'Incidencia' : 'Sugerencia'}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg mt-3"><p className="text-gray-700">{msg.message}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}