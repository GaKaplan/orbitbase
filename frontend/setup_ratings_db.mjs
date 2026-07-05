import mysql from 'mysql2/promise';

const dbConfig = {
  host: '54.94.87.16',
  user: 'admin',
  password: 'Infotech$123',
  database: 'orbitbase',
  port: 3306,
  connectTimeout: 20000 
};

async function setup() {
  const connection = await mysql.createConnection(dbConfig);
  console.log("Conectado a MySQL para configurar la tabla de Calificaciones.");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user_ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reviewer_address VARCHAR(64) NOT NULL,
      target_address VARCHAR(64) NOT NULL,
      stars INT NOT NULL CHECK (stars >= 0 AND stars <= 5),
      message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review (reviewer_address, target_address),
      INDEX idx_target (target_address)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.execute(createTableQuery);
  console.log("Tabla 'user_ratings' creada/verificada con éxito.");
  connection.end();
}

setup().catch(console.error);
