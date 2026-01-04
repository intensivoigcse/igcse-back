const { MercadoPagoConfig, Preference } = require('mercadopago');
const crypto = require('crypto');

// Obtener Access Token (acepta ambos nombres: MERCADOPAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN)
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

// Validar que el Access Token esté configurado
if (!accessToken) {
  console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN no está configurado en las variables de entorno');
}

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: accessToken || '',
  options: {
    timeout: 5000,
  },
});

const preference = new Preference(client);

/**
 * Crea una preferencia de pago en Mercado Pago
 * @param {Object} paymentData - Datos del pago
 * @param {number} paymentData.amount - Monto en CLP
 * @param {string} paymentData.title - Título del producto
 * @param {string} paymentData.description - Descripción del producto
 * @param {number} paymentData.inscriptionId - ID de la inscripción
 * @param {Object} paymentData.payer - Datos del pagador
 * @param {string} paymentData.backUrl - URL de retorno después del pago
 * @returns {Promise<Object>} Preferencia creada
 */
async function createPreference(paymentData) {
  try {
    // Obtener Access Token (acepta ambos nombres)
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    
    // Validar Access Token
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN o MP_ACCESS_TOKEN no está configurado. Por favor, agrega tu Access Token de Mercado Pago al archivo .env');
    }

    // Generar idempotency key único para cada request
    const idempotencyKey = crypto.randomUUID();

    const preferenceData = {
      items: [
        {
          title: paymentData.title || 'Donación',
          description: paymentData.description || 'Donación',
          quantity: 1,
          unit_price: Number(paymentData.amount),
          currency_id: 'CLP',
        },
      ],
      payer: paymentData.payer ? {
        name: paymentData.payer.name,
        email: paymentData.payer.email,
      } : undefined,
      back_urls: {
        success: `${process.env.APP_URL || 'http://localhost:3000'}/donations/success`,
        failure: `${process.env.APP_URL || 'http://localhost:3000'}/donations/failure`,
        pending: `${process.env.APP_URL || 'http://localhost:3000'}/donations/pending`,
      },
      external_reference: paymentData.inscriptionId.toString(),
      notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/donations/webhook`,
      statement_descriptor: 'DONACION',
    };

    // Remover campos undefined
    if (!preferenceData.payer) {
      delete preferenceData.payer;
    }
    
    // Obtener baseUrl una sola vez
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    // Asegurar que todas las URLs estén definidas correctamente
    preferenceData.back_urls = {
      success: `${baseUrl}/donations/success`,
      failure: `${baseUrl}/donations/failure`,
      pending: `${baseUrl}/donations/pending`,
    };
    
    // Solo agregar auto_return si las URLs son HTTPS (requerido por Mercado Pago)
    if (baseUrl.startsWith('https://')) {
      preferenceData.auto_return = 'approved';
    }
    
    // Debug: mostrar las URLs que se están enviando
    console.log('Creating preference with back_urls:', JSON.stringify(preferenceData.back_urls, null, 2));

    const response = await preference.create({ 
      body: preferenceData,
      requestOptions: {
        idempotencyKey: idempotencyKey,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    
    // Mejorar mensajes de error
    if (error.status === 403 || error.code === 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES') {
      throw new Error('Error de autenticación con Mercado Pago. Verifica que tu Access Token sea válido y tenga los permisos necesarios. Si estás usando un token de test, asegúrate de que sea un token de test válido.');
    }
    
    if (error.status === 401) {
      throw new Error('Access Token de Mercado Pago inválido. Verifica tu token en el archivo .env');
    }
    
    throw error;
  }
}

/**
 * Obtiene información de un pago por su ID
 * @param {string} paymentId - ID del pago en Mercado Pago
 * @returns {Promise<Object>} Información del pago
 */
async function getPayment(paymentId) {
  try {
    const { Payment } = require('mercadopago');
    const payment = new Payment(client);
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error getting Mercado Pago payment:', error);
    throw error;
  }
}

module.exports = {
  createPreference,
  getPayment,
};

