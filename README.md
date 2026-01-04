# Desarrollo-de-software-backend

# Crear la base de datos


## Instalar postgres
```
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```
## Iniciar postgres
```
sudo service postgresql start

```
## Entrar en la consola psql

```
sudo -u postgres psql
```

## Crear base de datos
```
CREATE DATABASE db_name;

CREATE USER db_user WITH ENCRYPTED PASSWORD 'db_password';


GRANT ALL PRIVILEGES ON DATABASE db_name TO db_user;

\q
```

# Archivo .env

## Variables de Base de Datos
```
DB_USER=db_user
DB_PASSWORD=db_password
DB_NAME=db_name
DB_NAME_TEST=db_test
DB_HOST=127.0.0.1
DB_PORT=5432
```
## Variables de la Aplicación
```
PORT=3000
NODE_ENV=development
JWT_SECRET=a3f6Lpx14AlLev7khsTDSjJbRaszHBTdHfsF8kBneXZOmsahu9tCnnz57HG/BS1E
```
## Variables de AWS
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
## Variables de Mercado Pago (Chile - CLP)
# Puedes usar cualquiera de estos dos nombres:
```
MP_ACCESS_TOKEN=tu_token_aqui
```
# O
```
MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
```

# URL de la aplicación (para desarrollo local)
APP_URL=http://localhost:3000
# En producción usar: APP_URL=https://tu-dominio.com

# Correr aplicación 

```bash
# development
npm run dev

# producción
npm run start
```

Al iniciar, verás en la consola:
```
Servidor iniciado en http://localhost:3000
📚 Documentación Swagger disponible en: http://localhost:3000/api-docs
```

## Documentación Swagger

La API está completamente documentada con Swagger. Accede a:
- **URL local**: http://localhost:3000/api-docs
- **Endpoint raíz**: `GET /` también muestra el link a Swagger

Desde Swagger puedes:
- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde la interfaz
- Autenticarte usando el botón "Authorize" e ingresando tu token JWT
- Ver los esquemas de datos y respuestas

# Crear migraciones
``` 
scripts/create_migration.sh <nombre de migracion>
```

# Correr migraciones
``` 
scripts/run_migrations.sh
```

# Integración con Mercado Pago

## Configuración Inicial

### 1. Obtener Access Token de Mercado Pago

1. **Crear cuenta de desarrollador:**
   - Ve a [Mercado Pago Developers](https://www.mercadopago.com/developers)
   - Inicia sesión con tu cuenta de Mercado Pago (o créala si no tienes una)

2. **Crear una aplicación:**
   - Ve al [Panel de desarrolladores](https://www.mercadopago.com/developers/panel)
   - Haz clic en "Crear aplicación"
   - Completa los datos:
     - **Nombre**: Tu aplicación (ej: "Donaciones Backend")
     - **Plataforma**: Web
     - **Categoría**: E-commerce u otra apropiada

3. **Obtener el Access Token:**
   
   **Para pruebas (Sandbox/Test):**
   - En el panel de tu aplicación, ve a la sección "Credenciales de prueba"
   - Copia el **Access Token** (empieza con `TEST-`)
   - Agrega al archivo `.env`:
     ```
     MP_ACCESS_TOKEN=TEST-tu-token-aqui
     ```
   
   **Para producción:**
   - En el panel de tu aplicación, ve a la sección "Credenciales de producción"
   - Copia el **Access Token** (empieza con `APP_USR-` o similar)
   - Agrega al archivo `.env`:
     ```
     MP_ACCESS_TOKEN=APP_USR-tu-token-aqui
     ```

### 2. Configurar URL de la aplicación

En tu archivo `.env`:
```
# Desarrollo local
APP_URL=http://localhost:3000

# Producción
APP_URL=https://tu-dominio.com
```

**Nota:** Si no defines `APP_URL`, se usará `http://localhost:3000` por defecto.

### 3. Configurar Webhook (Opcional para desarrollo)

**Para producción:**
- Ve a la configuración de tu aplicación en Mercado Pago
- Configura la URL del webhook: `https://tu-dominio.com/donations/webhook`

**Para desarrollo local:**
- Usa [ngrok](https://ngrok.com/) para exponer tu servidor local:
  ```bash
  ngrok http 3000
  ```
- Usa la URL HTTPS que ngrok proporciona: `https://tu-ngrok-url.ngrok.io/donations/webhook`

## Endpoints de Donaciones

Todos los endpoints están documentados en Swagger: `http://localhost:3000/api-docs`

### Endpoints disponibles:

- **`POST /donations`** - Crear una nueva donación (requiere autenticación JWT)
- **`GET /donations`** - Obtener todas las donaciones del usuario autenticado (requiere autenticación)
- **`GET /donations/:id`** - Obtener una donación por ID (requiere autenticación)
- **`GET /donations/:id/verify`** - Verificar el estado actual de una donación con Mercado Pago (requiere autenticación)
- **`POST /donations/webhook`** - Webhook de Mercado Pago para recibir notificaciones (público, sin autenticación)

## Uso de la API

### 1. Crear una donación

**Request:**
```bash
POST /donations
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "amount": 10000,
  "description": "Donación para el proyecto"
}
```

**Response (201):**
```json
{
  "id": 1,
  "amount": 10000,
  "description": "Donación para el proyecto",
  "status": "pending",
  "init_point": "https://www.mercadopago.com/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=..."
}
```

### 2. Redirigir al usuario al pago

Usa `sandbox_init_point` si estás en modo test, o `init_point` para producción:
```javascript
// Ejemplo en frontend
window.location.href = response.sandbox_init_point; // o response.init_point
```

### 3. El usuario completa el pago en Mercado Pago

Mercado Pago redirige al usuario de vuelta a las URLs configuradas:
- Éxito: `/donations/success`
- Fallo: `/donations/failure`
- Pendiente: `/donations/pending`

### 4. Mercado Pago notifica al webhook automáticamente

El webhook actualiza automáticamente el estado del pago en la base de datos.

### 5. Verificar estado manualmente (opcional)

```bash
GET /donations/:id/verify
Authorization: Bearer <tu_jwt_token>
```

## Estados de Pago

Los pagos pueden tener los siguientes estados:

- **`pending`** - Pago pendiente
- **`approved`** - Pago aprobado
- **`rejected`** - Pago rechazado
- **`cancelled`** - Pago cancelado
- **`refunded`** - Pago reembolsado

## Solución de Problemas

### Error: "MERCADOPAGO_ACCESS_TOKEN no está configurado"
- Verifica que el token esté en el archivo `.env`
- Puedes usar `MP_ACCESS_TOKEN` o `MERCADOPAGO_ACCESS_TOKEN`
- Reinicia el servidor después de agregar la variable

### Error: "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"
- Verifica que el Access Token sea válido
- Asegúrate de estar usando un token de test si estás en desarrollo
- Verifica que tu cuenta de Mercado Pago esté activa

### Error: "auto_return invalid. back_url.success must be defined"
- Este error ya está resuelto en el código
- Asegúrate de tener `APP_URL` configurado en tu `.env` (o déjalo sin definir para usar el valor por defecto)

### El webhook no recibe notificaciones
- Verifica que la URL del webhook sea accesible públicamente
- En desarrollo, usa ngrok para exponer tu servidor local
- Verifica los logs del servidor para ver si llegan las notificaciones

## Notas Importantes

- **Tokens de prueba**: Solo funcionan en el entorno de sandbox de Mercado Pago
- **Tokens de producción**: Requieren que tu cuenta esté verificada y aprobada
- **Moneda**: La integración está configurada para CLP (pesos chilenos)
- **HTTPS**: En producción, las URLs deben ser HTTPS para que `auto_return` funcione correctamente
- **Documentación Swagger**: Accede a `http://localhost:3000/api-docs` para ver la documentación interactiva de todos los endpoints 