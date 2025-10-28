import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 my-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-4">Aviso de Privacidad – Maderistas</h1>
      <p className="text-sm text-gray-500 mb-6">Última actualización: Octubre 2025</p>
      
      <p className="mb-4">
        Maderistas es una plataforma digital lúdica, sin fines de lucro, creada para fomentar la participación y convivencia entre fans.
      </p>
      
      <p className="mb-4">
        En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), informamos:
      </p>
      
      <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700">
        <li>
          <strong>Responsable:</strong> "Maderistas" – contacto: soportemaderistas@gmail.com
        </li>
        <li>
          <strong>Datos:</strong> nombre, usuario, correo electrónico y, opcionalmente, fotografía de perfil.
        </li>
        <li>
          <strong>Finalidades:</strong> identificarte, permitir acceso a tu cuenta y ranking lúdico, gestionar interacciones y evidencias.
        </li>
        <li>
          <strong>Transferencias:</strong> no compartimos ni vendemos datos a terceros.
        </li>
        <li>
          <strong>Seguridad:</strong> medidas técnicas y administrativas razonables.
        </li>
        <li>
          <strong>Derechos ARCO:</strong> escribe a soportemaderistas@gmail.com con el asunto "Privacidad".
        </li>
        <li>
          <strong>Cambios:</strong> se publicarán en este sitio.
        </li>
      </ul>
      
      <p className="font-semibold text-purple-600">
        Al registrarte o usar la plataforma, aceptas este Aviso de Privacidad.
      </p>
    </div>
  );
}
