const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Establecer NODE_ENV a 'production' si no está definido
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log(`Starting server in ${process.env.NODE_ENV} mode`);

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:4200', // Permite solicitudes solo desde este origen
  methods: 'GET,POST,PUT,DELETE', // Métodos permitidos
  allowedHeaders: 'Content-Type,Authorization' // Cabeceras permitidas
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

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Ruta para obtener los detalles del usuario autenticado
app.get('/usuarios/me', authenticateToken, (req, res) => {
  db.query('SELECT * FROM usuarios WHERE idUser = ?', [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  });
});

// Ruta para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
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

// Ruta para agregar un nuevo usuario
app.post('/usuarios', (req, res) => {
  const { nombre, apellido, contraseña, rol, email } = req.body;
  db.query('INSERT INTO usuarios (nombre, apellido, contraseña, rol, email) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, contraseña, rol, email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Usuario creado exitosamente', id: results.insertId });
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

// Ruta para el login de usuario
app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;
  
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE email = ? AND contraseña = ?', [email, contraseña], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      // Crear un token JWT aquí
      const token = jwt.sign({ id: results[0].idUser }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ usuario: results[0], token }); // Devolver el token junto con el usuario
    } else {
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }
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
