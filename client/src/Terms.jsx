import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 my-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-4">Términos y Condiciones – Maderistas</h1>
      <p className="text-sm text-gray-500 mb-6">Última actualización: Octubre 2025</p>
      
      <p className="mb-4">
        Bienvenido a Maderistas, una plataforma digital lúdica y de comunidad. Al acceder o registrarte, aceptas estos Términos y Condiciones.
      </p>
      
      <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700">
        <li>
          <strong>Naturaleza:</strong> espacio de participación simbólica y recreativa; sin recompensas económicas ni obligaciones contractuales.
        </li>
        <li>
          <strong>Registro y uso:</strong> brindar información veraz, cuidar tus credenciales y evitar publicar material ofensivo o inapropiado.
        </li>
        <li>
          <strong>Contenido:</strong> Maderistas puede moderar o eliminar contenido que vulnere reglas o derechos de terceros.
        </li>
        <li>
          <strong>Propiedad intelectual:</strong> diseño, logotipos y elementos visuales son del proyecto y no pueden usarse sin autorización.
        </li>
        <li>
          <strong>Limitación de responsabilidad:</strong> el uso es bajo responsabilidad del usuario.
        </li>
        <li>
          <strong>Contacto:</strong> contacto@maderistas.com
        </li>
      </ul>
      
      <p className="font-semibold text-purple-600">
        Al usar Maderistas confirmas que has leído y aceptas estos términos.
      </p>
    </div>
  );
}
