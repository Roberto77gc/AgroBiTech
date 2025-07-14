const mongoose = require('mongoose');

const InventoryProductSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  minStock: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryProduct', InventoryProductSchema); 