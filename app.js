const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Importa el paquete CORS
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
  origin: '*', // Permite solicitudes desde cualquier origen. Para producción, especifica los orígenes permitidos.
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
  db.query('INSERT INTO cursos (nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Curso creado exitosamente', id: results.insertId });
  });
});

// Ruta para el login de usuario
app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;
  
  // Verificar si el correo electrónico y la contraseña están presentes
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos' });
  }

  // Consultar el usuario en la base de datos
  db.query('SELECT * FROM usuarios WHERE email = ? AND contraseña = ?', [email, contraseña], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      // Usuario encontrado, enviar la respuesta con el usuario
      res.status(200).json(results[0]);
    } else {
      // Usuario no encontrado, enviar un mensaje de error
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
