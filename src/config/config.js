// Cargar dotenv solo si está disponible (opcional en producción donde las variables ya están disponibles)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv no disponible, pero las variables de entorno ya están disponibles en Render
}

// Función para parsear DATABASE_URL
function parseDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remover el '/' inicial
      host: url.hostname,
      port: url.port || 5432,
      dialect: "postgres"
    };
  }
  return null;
}

const dbConfig = parseDatabaseUrl();

module.exports = {
  development: {
    username: process.env.DB_USER || "myappuser",
    password: process.env.DB_PASSWORD || "mypassword",
    database: process.env.DB_NAME || "myappdb",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres"
  },
  test: {
    username: process.env.DB_USER || "myappuser",
    password: process.env.DB_PASSWORD || "mypassword",
    database: process.env.DB_NAME_TEST || "myappdb_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres"
  },
  production: dbConfig || {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres"
  }
};
