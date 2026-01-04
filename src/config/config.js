require('dotenv').config(); 

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
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres"
  }
};
