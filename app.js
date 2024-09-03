const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Importa el paquete CORS
const jsonfile = require('jsonfile'); // Importa el paquete jsonfile
require('dotenv').config(); // Carga variables de entorno

const app = express();
const port = process.env.PORT || 3000;
const dbFile = 'db.json'; // Ruta al archivo JSON donde se almacenan los datos

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

// Rutas con base de datos MySQL

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
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos' });
  }
  db.query('SELECT * FROM usuarios WHERE email = ? AND contraseña = ?', [email, contraseña], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }
  });
});

// Rutas con archivo JSON

// Ruta para obtener todos los usuarios del archivo JSON
app.get('/json/usuarios', (req, res) => {
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(data.usuarios || []);
  });
});

// Ruta para obtener todos los cursos del archivo JSON
app.get('/json/cursos', (req, res) => {
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(data.cursos || []);
  });
});

// Ruta para agregar un nuevo usuario al archivo JSON
app.post('/json/usuarios', (req, res) => {
  const { nombre, apellido, contraseña, rol, email } = req.body;
  if (!nombre || !apellido || !contraseña || !rol || !email) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const newUser = {
      id: data.usuarios.length + 1,
      nombre,
      apellido,
      contraseña,
      rol,
      email
    };
    data.usuarios.push(newUser);
    jsonfile.writeFile(dbFile, data, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Usuario creado exitosamente', id: newUser.id });
    });
  });
});

// Ruta para agregar un nuevo curso al archivo JSON
app.post('/json/cursos', (req, res) => {
  const { nombreProfesor, genero, telefono, nombreCurso, fecha, email, tiempo, precioCurso, tipoCurso, salon, descripcion } = req.body;
  if (!nombreProfesor || !genero || !telefono || !nombreCurso || !fecha || !email || !tiempo || !precioCurso || !tipoCurso || !salon || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const newCourse = {
      id: data.cursos.length + 1,
      nombreProfesor,
      genero,
      telefono,
      nombreCurso,
      fecha,
      email,
      tiempo,
      precioCurso,
      tipoCurso,
      salon,
      descripcion
    };
    data.cursos.push(newCourse);
    jsonfile.writeFile(dbFile, data, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Curso creado exitosamente', id: newCourse.id });
    });
  });
});

// Ruta para el login de usuario usando archivo JSON
app.post('/json/login', (req, res) => {
  const { email, contraseña } = req.body;
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son requeridos' });
  }
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const user = data.usuarios.find(u => u.email === email && u.contraseña === contraseña);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
    }
  });
});

// Ruta para eliminar un curso usando archivo JSON
app.delete('/json/cursos/:idCurso', (req, res) => {
  const { idCurso } = req.params;
  jsonfile.readFile(dbFile, (err, data) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const filteredCursos = data.cursos.filter(curso => curso.id !== parseInt(idCurso, 10));
    if (filteredCursos.length === data.cursos.length) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    data.cursos = filteredCursos;
    jsonfile.writeFile(dbFile, data, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: 'Curso eliminado exitosamente' });
    });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
