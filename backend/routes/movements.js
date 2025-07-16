const express = require('express');
const router = express.Router();
const Movement = require('../models/Movement');
const auth = require('../middleware/auth');

// Registrar un movimiento
router.post('/', auth, async (req, res) => {
  try {
    const { type, product, quantity, userId, userName, notes } = req.body;
    if (!type || !product || !product.id || !product.name || !product.unit || !userId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const movement = new Movement({
      type,
      product,
      quantity,
      userId,
      userName,
      notes
    });
    await movement.save();
    res.status(201).json({ movement });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar movimiento', error: err.message });
  }
});

// Obtener movimientos de un usuario
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    // Opcional: comprobar que el usuario autenticado es el mismo que el solicitado
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'No tienes permiso para ver estos movimientos.' });
    }
    const movements = await Movement.find({ userId })
      .sort({ date: -1 });
    res.json({ movements });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener movimientos', error: err.message });
  }
});

module.exports = router; 