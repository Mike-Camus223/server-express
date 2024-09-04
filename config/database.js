const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let db;

if (process.env.NODE_ENV === 'production') {
  // Conexión a la base de datos MySQL en producción
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  db.connect((err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err);
      process.exit(1);
    }
    console.log('Conexión a la base de datos establecida.');
  });
} else {
  // Cargar datos desde db.json para entorno de desarrollo
  const dbPath = path.join(__dirname, '../db.json');
  db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log('Conectado a la base de datos local (db.json).');
}

module.exports = db;
