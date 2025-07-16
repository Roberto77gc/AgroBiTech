const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['alta', 'edicion', 'baja', 'entrada', 'salida'],
    required: true
  },
  product: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryProduct', required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    category: { type: String },
  },
  quantity: { type: Number }, // Solo para entrada/salida
  userId: { type: String, required: true },
  userName: { type: String }, // Opcional, para mostrar quién hizo el cambio
  date: { type: Date, default: Date.now },
  notes: { type: String }, // Opcional, para detalles adicionales
});

module.exports = mongoose.model('Movement', movementSchema); 