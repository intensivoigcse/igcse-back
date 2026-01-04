// Cargar dotenv solo si está disponible (opcional en producción donde las variables ya están disponibles)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv no disponible, pero las variables de entorno ya están disponibles en Render
}

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');
const { sequelize } = require('./models'); // import Sequelize instance
const swaggerUi = require('koa2-swagger-ui').koaSwagger;
const swaggerSpec = require('./config/swagger');

const app = new Koa();

// Swagger UI
app.use(
  swaggerUi({
    routePrefix: '/api-docs',
    swaggerOptions: {
      spec: swaggerSpec,
    },
  })
);

app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos exitosa.');

        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('Tablas sincronizadas con la base de datos.');
        }

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor iniciado en http://localhost:${PORT}`);
            console.log(`📚 Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
        });
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1);
    }
}
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
