import React from 'react';

// Componente tooltip personalizado para gráficos
interface CustomTooltipProps {
  active?: boolean;
  payload?: any;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-2 rounded shadow"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          minWidth: 80
        }}
      >
        <div
          style={{
            color: "#222",
            fontWeight: 500,
            marginBottom: 4
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: "#22c55e",
            fontWeight: 600
          }}
        >
          total: {payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip; 