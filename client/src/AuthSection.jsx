import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { API_URL } from './config';

function AuthSection({ setCurrentUser, setCurrentSection }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState({ checking: false, available: null, message: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Función helper para manejar cambios en inputs (incluyendo autocompletado)
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validar username en tiempo real
  useEffect(() => {
    if (!isLogin && formData.username && formData.username.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setUsernameCheck({ checking: true, available: null, message: '' });
        try {
          const res = await fetch(`${API_URL}/auth/check-username`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.username })
          });
          const data = await res.json();
          setUsernameCheck({ 
            checking: false, 
            available: data.available, 
            message: data.message 
          });
        } catch (err) {
          setUsernameCheck({ checking: false, available: null, message: '' });
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (!isLogin && formData.username && formData.username.length < 3) {
      setUsernameCheck({ checking: false, available: false, message: 'Mínimo 3 caracteres' });
    } else {
      setUsernameCheck({ checking: false, available: null, message: '' });
    }
  }, [formData.username, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Logging para debugging
    console.log('FormData actual:', formData);

    if (!isLogin) {
      // Validaciones de registro MÁS ESTRICTAS
      if (!formData.name || formData.name.trim() === '') {
        setError('El nombre es obligatorio');
        return;
      }
      if (!formData.username || formData.username.trim() === '') {
        setError('El usuario es obligatorio');
        return;
      }
      if (!formData.email || formData.email.trim() === '') {
        setError('El email es obligatorio');
        return;
      }
      if (!formData.password || formData.password.trim() === '') {
        setError('La contraseña es obligatoria');
        return;
      }
      if (formData.password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!usernameCheck.available) {
        setError('Usuario no disponible');
        return;
      }
      if (!acceptedTerms) {
        setError('Debes aceptar los Términos y Condiciones');
        return;
      }
      if (!acceptedPrivacy) {
        setError('Debes aceptar el Aviso de Privacidad');
        return;
      }
    }

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
        // Crear FormData con validación
        const form = new FormData();
        
        const username = formData.username?.trim();
        const password = formData.password?.trim();
        const name = formData.name?.trim();
        const email = formData.email?.trim();
        
        console.log('Enviando datos:', { username, name, email, password: '***', hasPhoto: !!photo });
        
        if (!username || !password || !name || !email) {
          throw new Error('Todos los campos son obligatorios');
        }
        
        form.append('username', username);
        form.append('password', password);
        form.append('name', name);
        form.append('email', email);
        if (photo) form.append('photo', photo);
        
        // Verificar que FormData tiene los datos
        console.log('FormData entries:');
        for (let [key, value] of form.entries()) {
          console.log(key, typeof value === 'string' ? value : '[File]');
        }
        
        const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setSuccess('¡Cuenta creada! Ahora puedes iniciar sesión.');
        setFormData({});
        setConfirmPassword('');
        setPhoto(null);
        
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  name="name"
                  required 
                  autoComplete="name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onInput={(e) => handleInputChange('name', e.target.value)}
                  onBlur={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Usuario</label>
                <p className="text-xs text-gray-500 mb-2">
                  Es como te mostrarás en el ranking. Ej: <span className="font-semibold">AlejandradaDeMadero</span>
                </p>
                <div className="relative">
                  <input 
                    type="text" 
                    name="username"
                    required 
                    minLength="3"
                    autoComplete="username"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none pr-10 ${
                      usernameCheck.available === true ? 'border-green-500 focus:ring-green-500' :
                      usernameCheck.available === false ? 'border-red-500 focus:ring-red-500' :
                      'focus:ring-purple-500'
                    }`}
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value.trim())}
                    onInput={(e) => handleInputChange('username', e.target.value.trim())}
                    onBlur={(e) => handleInputChange('username', e.target.value.trim())}
                    placeholder="SinEspacios"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameCheck.checking && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    )}
                    {usernameCheck.available === true && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {usernameCheck.available === false && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {usernameCheck.message && (
                  <p className={`text-xs mt-1 ${usernameCheck.available ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameCheck.message}
                  </p>
                )}
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              required 
              autoComplete="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" 
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onInput={(e) => handleInputChange('email', e.target.value)}
              onBlur={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                name="password"
                required 
                minLength="6"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none pr-10" 
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onInput={(e) => handleInputChange('password', e.target.value)}
                onBlur={(e) => handleInputChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm-password"
                  required 
                  minLength="6"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none pr-10 ${
                    confirmPassword && formData.password === confirmPassword ? 'border-green-500 focus:ring-green-500' :
                    confirmPassword && formData.password !== confirmPassword ? 'border-red-500 focus:ring-red-500' :
                    'focus:ring-purple-500'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onInput={(e) => setConfirmPassword(e.target.value)}
                  onBlur={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1 ${formData.password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.password === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>
          )}
          
          {!isLogin && (
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  Acepto los{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/terms', '_blank');
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Términos y Condiciones
                  </button>
                </label>
              </div>
              
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="privacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="privacy" className="text-sm text-gray-700">
                  Acepto el{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/privacy', '_blank');
                    }}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Aviso de Privacidad
                  </button>
                </label>
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={!isLogin && (!usernameCheck.available || !acceptedTerms || !acceptedPrivacy)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-sm">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setFormData({});
              setConfirmPassword('');
              setShowPassword(false);
              setShowConfirmPassword(false);
              setUsernameCheck({ checking: false, available: null, message: '' });
              setAcceptedTerms(false);
              setAcceptedPrivacy(false);
            }} 
            className="text-purple-600 font-semibold ml-2 hover:underline"
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthSection;