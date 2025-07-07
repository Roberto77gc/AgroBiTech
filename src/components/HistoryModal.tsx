import React from 'react';

// Componente modal para mostrar el historial de actividades
const HistoryModal = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, 0)',
        background: '#222e3a',
        color: '#fff',
        padding: '2rem',
        borderRadius: '10px',
        zIndex: 1000,
        minWidth: '300px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}
    >
      <h2 style={{ marginBottom: '1rem' }}>Historial de actividades</h2>
      <p>Aquí irá el contenido del historial...</p>
      {/* Puedes añadir aquí la lista de actividades, buscador, etc. */}
    </div>
  );
};

export default HistoryModal;
