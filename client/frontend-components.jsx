// Frontend Components - Todos los componentes con alertas de límites

// ==================== AVATAR CON INICIALES ====================

const Avatar = ({ user, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = [
      'bg-gradient-to-br from-red-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-yellow-500 to-orange-500',
      'bg-gradient-to-br from-purple-500 to-indigo-500',
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-indigo-500 to-violet-500',
      'bg-gradient-to-br from-teal-500 to-cyan-500'
    ];
    
    if (!name) return 'bg-gray-500';
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  if (user.photo) {
    return (
      <div className="relative">
        <img
          src={user.photo}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow-md`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div
          className={`${sizes[size]} ${getColorFromName(user.name)} rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white`}
          style={{ display: 'none' }}
        >
          {getInitials(user.name || user.username)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} ${getColorFromName(user.name)} rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white`}
    >
      {getInitials(user.name || user.username)}
    </div>
  );
};

// ==================== ALERTA DE LÍMITES DE IMÁGENES ====================

const ImageLimitsAlert = ({ type }) => {
  const limits = {
    profile: {
      icon: '👤',
      title: 'Foto de Perfil',
      size: '500 KB',
      dimensions: '400 x 400 píxeles',
      formats: 'JPG, PNG, GIF',
      note: 'Tu foto se optimizará automáticamente al subirla'
    },
    banner: {
      icon: '🎨',
      title: 'Banner',
      size: '800 KB',
      dimensions: '1920 x 400 píxeles',
      formats: 'JPG, PNG, GIF',
      note: 'El banner se optimizará automáticamente al subirlo'
    },
    submission: {
      icon: '📄',
      title: 'Evidencia',
      size: '2 MB',
      dimensions: 'Ancho máximo 1200 píxeles',
      formats: 'JPG, PNG, GIF, PDF',
      note: 'Las imágenes se optimizarán automáticamente. Los PDFs se mantienen sin cambios.'
    }
  };

  const limit = limits[type];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-2xl mr-3">{limit.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">{limit.title}</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>📏 <strong>Tamaño máximo:</strong> {limit.size}</li>
            <li>📐 <strong>Dimensiones:</strong> {limit.dimensions}</li>
            <li>🖼️ <strong>Formatos:</strong> {limit.formats}</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2 italic">
            💡 {limit.note}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE DE SUBIR FOTO CON ALERTAS ====================

const PhotoUploadWithLimits = ({ currentPhoto, onUploadSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(currentPhoto);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, GIF)');
      return;
    }

    // Validar tamaño (10MB antes de optimizar)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe superar 10MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Subir
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
        if (onUploadSuccess) onUploadSuccess(data.photo);
        setError(null);
      } else {
        setError(data.error || 'Error al subir la foto');
        setPreview(currentPhoto);
      }
    } catch (error) {
      setError('Error de conexión al subir la foto');
      setPreview(currentPhoto);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar tu foto de perfil?')) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/delete-photo', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPreview(null);
        if (onUploadSuccess) onUploadSuccess(null);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerta de límites */}
      <ImageLimitsAlert type="profile" />

      {/* Preview */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
              <span className="text-5xl">📷</span>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        {/* Success */}
        {!error && uploading === false && preview !== currentPhoto && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
            ✅ Foto optimizada y guardada exitosamente
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {preview ? '🔄 Cambiar foto' : '📤 Subir foto'}
          </button>
          
          {preview && (
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

// ==================== COMPONENTE PARA SUBIR EVIDENCIAS CON ALERTAS ====================

const SubmissionUpload = ({ rewardId, onSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    // Preview solo para imágenes
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      setPreview('PDF');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, GIF) o PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar 10MB');
      return;
    }

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

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) onSuccess();
        setFile(null);
        setPreview(null);
        setError(null);
      } else {
        setError(data.error || 'Error al enviar la evidencia');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerta de límites */}
      <ImageLimitsAlert type="submission" />

      {/* Selector de archivo */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        {preview ? (
          <div className="space-y-2">
            {preview === 'PDF' ? (
              <div className="text-6xl">📄</div>
            ) : (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
            )}
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-2">📎</div>
            <p className="text-gray-600 mb-2">Arrastra tu archivo aquí o</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Seleccionar archivo
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Botones */}
      {file && (
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {uploading ? '⏳ Subiendo...' : '✅ Enviar evidencia'}
          </button>
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
              setError(null);
            }}
            disabled={uploading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors font-medium"
          >
            ❌ Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTE PARA SUBIR BANNER CON ALERTAS ====================

const BannerUploadWithLimits = ({ currentBanner, onUploadSuccess }) => {
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState(currentBanner?.image_path);
  const [url, setUrl] = React.useState(currentBanner?.url || '');
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe superar 10MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Subir
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('url', url);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/banner', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        if (onUploadSuccess) onUploadSuccess(data);
        setError(null);
      } else {
        setError(data.error || 'Error al subir el banner');
        setPreview(currentBanner?.image_path);
      }
    } catch (error) {
      setError('Error de conexión');
      setPreview(currentBanner?.image_path);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerta de límites */}
      <ImageLimitsAlert type="banner" />

      {/* Preview */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden shadow-lg">
          <img
            src={preview}
            alt="Banner preview"
            className="w-full h-48 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )}

      {/* URL opcional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL del enlace (opcional)
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://ejemplo.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {/* Botón */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {preview ? '🔄 Cambiar banner' : '📤 Subir banner'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

// ==================== BOTÓN DUPLICAR RECOMPENSA ====================

const DuplicateRewardButton = ({ rewardId, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDuplicate = async () => {
    if (!confirm('¿Duplicar esta recompensa?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rewards/${rewardId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Recompensa duplicada exitosamente');
        if (onSuccess) onSuccess();
      } else {
        alert(`❌ ${data.error || 'Error al duplicar'}`);
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
    >
      {loading ? '⏳' : '📋'} Duplicar
    </button>
  );
};

// Exportar todos los componentes
export {
  Avatar,
  ImageLimitsAlert,
  PhotoUploadWithLimits,
  SubmissionUpload,
  BannerUploadWithLimits,
  DuplicateRewardButton
};
