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
  console.log("Conectado a MySQL para configurar Mensajes de Comunidad.");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS pool_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pool_address VARCHAR(64) NOT NULL,
      sender_address VARCHAR(64) NULL,
      sender_name VARCHAR(100) NULL,
      message TEXT NOT NULL,
      reply_to_id INT NULL,
      target_type VARCHAR(50) DEFAULT 'public',
      recipient_addresses TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pool (pool_address),
      INDEX idx_created (created_at),
      FOREIGN KEY (reply_to_id) REFERENCES pool_messages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.execute(createTableQuery);
  console.log("Tabla 'pool_messages' creada/verificada con éxito.");
  connection.end();
}

setup().catch(console.error);
