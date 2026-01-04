#!/usr/bin/env node

/**
 * Script personalizado para ejecutar migraciones de Sequelize
 * Maneja el caso cuando no hay migraciones y es compatible con Node.js 22
 */

// Cargar dotenv solo si está disponible (opcional en producción)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv no está disponible, pero las variables de entorno ya están disponibles en Render
  console.log('ℹ️  dotenv no disponible, usando variables de entorno del sistema');
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, '../src/migrations');
    
    // Verificar si existe la carpeta de migraciones
    if (!fs.existsSync(migrationsPath)) {
      console.log('ℹ️  No se encontró la carpeta de migraciones. Creando...');
      fs.mkdirSync(migrationsPath, { recursive: true });
    }

    // Verificar si hay archivos de migración
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js') && file !== '.gitkeep')
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️  No hay migraciones para ejecutar. El build continuará.');
      console.log('ℹ️  Las tablas se crearán automáticamente al iniciar la aplicación.');
      return;
    }

    console.log(`📦 Encontradas ${migrationFiles.length} migración(es) para ejecutar.`);

    // Intentar ejecutar migraciones con sequelize-cli
    try {
      console.log('🔄 Ejecutando migraciones...');
      execSync('npx sequelize-cli db:migrate', {
        stdio: 'inherit',
        env: process.env,
        cwd: path.join(__dirname, '..'),
      });
      console.log('✅ Migraciones ejecutadas exitosamente.');
    } catch (error) {
      console.error('⚠️  Error ejecutando sequelize-cli:', error.message);
      console.log('ℹ️  El build continuará. Las migraciones se pueden ejecutar manualmente después.');
      // No hacer exit(1) para que el build continúe
    }
  } catch (error) {
    console.error('❌ Error en el script de migraciones:', error.message);
    console.log('ℹ️  Continuando con el build. Las migraciones se pueden ejecutar manualmente.');
    // No hacer exit(1) para que el build continúe
  }
}

runMigrations();

