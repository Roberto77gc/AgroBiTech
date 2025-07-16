const express = require('express');
const router = express.Router();
const InventoryProduct = require('../models/InventoryProduct');
const Movement = require('../models/Movement');
const auth = require('../middleware/auth');

// Obtener inventario de un usuario
router.get('/:userId', auth, async (req, res) => {
  try {
    const products = await InventoryProduct.find({ userId: req.params.userId });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener inventario', error: err.message });
  }
});

// Añadir producto
router.post('/', auth, async (req, res) => {
  try {
    const { userId, name, quantity, unit, category, minStock } = req.body;
    if (!userId || !name || quantity === undefined || !unit || !category) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const product = new InventoryProduct({ userId, name, quantity, unit, category, minStock });
    await product.save();

    // Registrar movimiento de alta
    await Movement.create({
      type: 'alta',
      product: {
        id: product._id,
        name: product.name,
        unit: product.unit,
        category: product.category
      },
      userId: product.userId,
      userName: req.user && req.user.email ? req.user.email : undefined
    });
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Error al añadir producto', error: err.message });
  }
});

// Editar producto
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, minStock } = req.body;
    const product = await InventoryProduct.findByIdAndUpdate(
      req.params.id,
      { name, quantity, unit, category, minStock },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Registrar movimiento de edición
    await Movement.create({
      type: 'edicion',
      product: {
        id: product._id,
        name: product.name,
        unit: product.unit,
        category: product.category
      },
      userId: product.userId,
      userName: req.user && req.user.email ? req.user.email : undefined
    });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Error al editar producto', error: err.message });
  }
});

// Borrar producto
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await InventoryProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Registrar movimiento de baja
    await Movement.create({
      type: 'baja',
      product: {
        id: product._id,
        name: product.name,
        unit: product.unit,
        category: product.category
      },
      userId: product.userId,
      userName: req.user && req.user.email ? req.user.email : undefined
    });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al borrar producto', error: err.message });
  }
});

module.exports = router; 