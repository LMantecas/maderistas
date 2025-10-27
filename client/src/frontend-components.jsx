// Frontend - Componentes simplificados

// ==================== AVATAR CON INICIALES ====================
const Avatar = ({ user, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' };
  
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    return names.length === 1 ? names[0][0].toUpperCase() : (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };
  
  const getColor = (name) => {
    const colors = ['bg-gradient-to-br from-red-500 to-pink-500', 'bg-gradient-to-br from-blue-500 to-cyan-500', 'bg-gradient-to-br from-green-500 to-emerald-500', 'bg-gradient-to-br from-purple-500 to-indigo-500'];
    return name ? colors[name.charCodeAt(0) % colors.length] : 'bg-gray-500';
  };

  if (user.photo) {
    return (
      <div className="relative">
        <img src={user.photo} alt={user.name} className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow-md`} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
        <div className={`${sizes[size]} ${getColor(user.name)} rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white`} style={{display:'none'}}>
          {getInitials(user.name || user.username)}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} ${getColor(user.name)} rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white`}>
      {getInitials(user.name || user.username)}
    </div>
  );
};

// ==================== ALERTA SIMPLE ====================
const ImageOptimizationInfo = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
    ✨ <strong>Optimización automática:</strong> Sube cualquier foto, la ajustaremos automáticamente al mejor tamaño y calidad.
  </div>
);

// ==================== SUBIR FOTO DE PERFIL ====================
const PhotoUpload = ({ currentPhoto, onSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(currentPhoto);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Solo imágenes por favor');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) onSuccess(data.photo);
        setError(null);
      } else {
        setError(data.error);
        setPreview(currentPhoto);
      }
    } catch (error) {
      setError('Error de conexión');
      setPreview(currentPhoto);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar foto?')) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/delete-photo', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPreview(null);
        if (onSuccess) onSuccess(null);
      }
    } catch (error) {
      setError('Error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImageOptimizationInfo />
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {preview ? (
            <img src={preview} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center shadow-lg">
              <span className="text-5xl">📷</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">❌ {error}</div>}

        <div className="flex space-x-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {preview ? '🔄 Cambiar' : '📤 Subir'}
          </button>
          {preview && (
            <button onClick={handleDelete} disabled={uploading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              🗑️ Eliminar
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );
};

// ==================== SUBIR EVIDENCIA ====================
const SubmissionUpload = ({ rewardId, onSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('PDF');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reward_id', rewardId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        if (onSuccess) onSuccess();
        setFile(null);
        setPreview(null);
      }
    } catch (error) {
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ImageOptimizationInfo />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {preview ? (
          <div>
            {preview === 'PDF' ? <div className="text-6xl">📄</div> : <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />}
            <p className="text-sm text-gray-600 mt-2">{file.name}</p>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-2">📎</div>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Seleccionar archivo
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
      </div>

      {file && (
        <div className="flex space-x-2">
          <button onClick={handleUpload} disabled={uploading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50">
            {uploading ? '⏳ Subiendo...' : '✅ Enviar'}
          </button>
          <button onClick={() => { setFile(null); setPreview(null); }} disabled={uploading} className="px-6 py-3 bg-gray-600 text-white rounded-lg">
            ❌
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== DUPLICAR RECOMPENSA ====================
const DuplicateRewardButton = ({ rewardId, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDuplicate = async () => {
    if (!confirm('¿Duplicar?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rewards/${rewardId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Duplicada');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDuplicate} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
      {loading ? '⏳' : '📋'} Duplicar
    </button>
  );
};

export { Avatar, PhotoUpload, SubmissionUpload, DuplicateRewardButton, ImageOptimizationInfo };
