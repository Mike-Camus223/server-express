const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');  // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret'; // Llave secreta para firmar tokens

// Configuración de CORS
app.use(cors({
  origin: '*', // Cambiar en producción para restringir a orígenes específicos
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use(express.json());

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida.');
});

// Ruta para registrar un nuevo usuario con contraseña encriptada
app.post('/usuarios', async (req, res) => {
  const { nombre, apellido, contraseña, rol, email } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    db.query('INSERT INTO usuarios (nombre, apellido, contraseña, rol, email) VALUES (?, ?, ?, ?, ?)', 
      [nombre, apellido, hashedPassword, rol, email], 
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Usuario creado exitosamente', id: results.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Ruta para el login de usuario con JWT
app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;

  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }

    const user = results[0];

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!validPassword) {
      return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }

    // Generar el token JWT
    const token = jwt.sign({ idUser: user.idUser, email: user.email, rol: user.rol }, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({ token, user: { idUser: user.idUser, email: user.email, nombre: user.nombre, rol: user.rol } });
  });
});

// Middleware para proteger rutas con autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Ruta protegida de ejemplo
app.get('/perfil', authenticateToken, (req, res) => {
  res.json({ message: 'Perfil de usuario', user: req.user });
});

// Ruta para obtener todos los usuarios (protegida)
app.get('/usuarios', authenticateToken, (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener todos los cursos
app.get('/cursos', (req, res) => {
  db.query('SELECT * FROM cursos', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para agregar un nuevo curso
app.post('/cursos', (req, res) => {
  const { nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion } = req.body;

  db.query('INSERT INTO cursos (nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
  [nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion], 
  (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Curso creado exitosamente', id: results.insertId });
  });
});

// Ruta para eliminar un curso
app.delete('/cursos/:idCurso', (req, res) => {
  const { idCurso } = req.params;

  db.query('DELETE FROM cursos WHERE idCurso = ?', [idCurso], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.affectedRows > 0) {
      res.status(200).json({ message: 'Curso eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Curso no encontrado' });
    }
  });
});

// Ruta para actualizar un curso
app.put('/cursos/:idCurso', (req, res) => {
  const { idCurso } = req.params;
  const { nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion } = req.body;

  db.query('UPDATE cursos SET nombreProfesor = ?, genero = ?, telefono = ?, nombreCurso = ?, fecha = ?, email = ?, tiempo = ?, precioCurso = ?, tipoCurso = ?, salon = ?, descripcion = ? WHERE idCurso = ?', 
    [nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion, idCurso], 
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows > 0) {
        res.status(200).json({ message: 'Curso actualizado exitosamente' });
      } else {
        res.status(404).json({ error: 'Curso no encontrado' });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
