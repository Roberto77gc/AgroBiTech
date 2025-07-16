const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3001;
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateToken = require('./middleware/auth');
const inventoryRouter = require('./routes/inventory');
const movementsRouter = require('./routes/movements');

// Usar la URL de MongoDB desde variables de entorno
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://robertovalidosuarez:U4yK9DcZoFmZId7g@cluster0.nhk7mha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB Atlas:', err));

// Middleware para parsear JSON
app.use(express.json());
app.use(cors());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡El backend está funcionando correctamente!');
});

// Simulación de base de datos en memoria
const users = [];

// 1. Definir el modelo de usuario con mongoose
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Faltan datos para el registro.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'El usuario ya está registrado.' });
    }

    // Cifrar la contraseña antes de guardar
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({ email, password: hashedPassword, name });

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json({ message: 'Usuario registrado con éxito.', user: userWithoutPassword });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan datos para iniciar sesión.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' } // El token expira en 2 horas
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      message: 'Inicio de sesión exitoso.',
      user: userWithoutPassword,
      token // ← Aquí va el token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

// 2. Definir el modelo de actividad con mongoose
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  cropType: { type: String, required: true },
  plantsCount: { type: Number, required: true },
  surfaceArea: { type: Number, required: true },
  waterUsed: { type: Number, required: true },
  products: { type: Array, default: [] },
  location: { type: Object, default: {} },
  totalCost: { type: Number, required: true },
  costPerHectare: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

// Ruta para guardar una nueva actividad
app.post('/api/actividades', async (req, res) => {
  try {
    const actividad = req.body;
    // Elimina el _id si viene del frontend para evitar duplicados
    if (actividad._id) {
      delete actividad._id;
    }
    // Asegúrate de añadir el userId (ajusta según tu lógica de autenticación)
    // Si usas autenticación y tienes el user en req.user, usa eso:
    // actividad.userId = req.user._id;
    // Si no, usa el userId que venga del frontend (menos seguro, pero funcional para pruebas):
    actividad.userId = req.body.userId;

    // Inserta la nueva actividad
    const result = await Activity.create(actividad);
    res.status(201).json({ activity: result });
  } catch (error) {
    console.error('Error al guardar actividad:', error);
    res.status(500).json({ message: 'Error al guardar actividad' });
  }
});

// Ruta para obtener todas las actividades de un usuario
app.get('/activities/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  // Comprobar que el usuario autenticado es el mismo que el de la URL
  if (userId !== req.user.userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver estas actividades.' });
  }
  try {
    const activities = await Activity.find({ userId });
    res.json({ activities });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ message: 'Error al obtener las actividades.' });
  }
});

// Eliminar actividad
app.delete('/activities/:activityId', authenticateToken, async (req, res) => {
  const { activityId } = req.params;
  try {
    await Activity.findByIdAndDelete(activityId);
    res.json({ message: 'Actividad eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la actividad' });
  }
});

// Editar actividad
app.put('/activities/:activityId', authenticateToken, async (req, res) => {
  const { activityId } = req.params;
  try {
    const updated = await Activity.findByIdAndUpdate(activityId, req.body, { new: true });
    res.json({ activity: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la actividad' });
  }
});

app.use('/api/inventory', inventoryRouter);
app.use('/api/movements', movementsRouter);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
}); 