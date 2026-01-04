const { Payment, User } = require('../models');
const mercadoPagoService = require('../services/mercadopago');
const auth = require('../auth/auth');

module.exports = {
    /**
     * Crea una nueva donación/pago
     */
    async create(ctx) {
        try {
            const userId = auth.getUserIdFromToken(ctx);
            const { amount, description } = ctx.request.body;

            // Validar monto
            if (!amount || amount <= 0) {
                ctx.status = 400;
                ctx.body = { error: 'El monto debe ser mayor a 0' };
                return;
            }

            // Obtener usuario
            const user = await User.findByPk(userId);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'Usuario no encontrado' };
                return;
            }

            // Crear registro de pago
            const payment = await Payment.create({
                userId,
                amount,
                description: description || 'Donación',
                status: 'pending',
            });

            // Crear preferencia en Mercado Pago
            const preferenceData = {
                amount,
                title: description || 'Donación',
                description: description || 'Donación',
                inscriptionId: payment.id,
                payer: {
                    name: user.name,
                    email: user.email,
                },
            };

            try {
                const preference = await mercadoPagoService.createPreference(preferenceData);

                // Actualizar el pago con el ID de la preferencia
                await payment.update({
                    mercadoPagoPreferenceId: preference.id,
                });

                ctx.status = 201;
                ctx.body = {
                    id: payment.id,
                    amount: payment.amount,
                    description: payment.description,
                    status: payment.status,
                    init_point: preference.init_point,
                    sandbox_init_point: preference.sandbox_init_point,
                };
            } catch (mpError) {
                // Si falla la creación de la preferencia, eliminar el pago creado
                await payment.destroy();
                throw mpError;
            }
        } catch (err) {
            console.error('Error creating payment:', err);
            
            // Mensajes de error más específicos
            if (err.message.includes('MERCADOPAGO_ACCESS_TOKEN')) {
                ctx.status = 500;
                ctx.body = { 
                    error: err.message,
                    hint: 'Agrega MERCADOPAGO_ACCESS_TOKEN a tu archivo .env'
                };
            } else if (err.message.includes('autenticación') || err.message.includes('Access Token')) {
                ctx.status = 401;
                ctx.body = { 
                    error: err.message,
                    hint: 'Verifica que tu Access Token de Mercado Pago sea válido. Puedes obtenerlo en https://www.mercadopago.com/developers/panel'
                };
            } else {
                ctx.status = 500;
                ctx.body = { error: 'Error al crear el pago: ' + err.message };
            }
        }
    },

    /**
     * Obtiene todos los pagos del usuario autenticado
     */
    async getAll(ctx) {
        try {
            const userId = auth.getUserIdFromToken(ctx);
            const payments = await Payment.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });

            ctx.body = payments;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error al obtener los pagos' };
        }
    },

    /**
     * Obtiene un pago por ID
     */
    async getById(ctx) {
        try {
            const userId = auth.getUserIdFromToken(ctx);
            const { id } = ctx.params;

            const payment = await Payment.findOne({
                where: { id, userId },
            });

            if (!payment) {
                ctx.status = 404;
                ctx.body = { error: 'Pago no encontrado' };
                return;
            }

            ctx.body = payment;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error al obtener el pago' };
        }
    },

    /**
     * Webhook de Mercado Pago para recibir notificaciones
     * Maneja diferentes formatos de notificación de Mercado Pago
     */
    async webhook(ctx) {
        try {
            let paymentId = null;
            let mpPayment = null;

            // Formato 1: Notificación IPN con query parameter
            if (ctx.query && ctx.query['data.id']) {
                paymentId = ctx.query['data.id'];
            }
            // Formato 2: Notificación con body { type: 'payment', data: { id: '...' } }
            else if (ctx.request.body && ctx.request.body.type === 'payment' && ctx.request.body.data) {
                paymentId = ctx.request.body.data.id;
            }
            // Formato 3: Notificación directa con payment_id en el body
            else if (ctx.request.body && ctx.request.body.payment_id) {
                paymentId = ctx.request.body.payment_id;
            }
            // Formato 4: Notificación con id directo
            else if (ctx.request.body && ctx.request.body.id) {
                paymentId = ctx.request.body.id;
            }

            if (!paymentId) {
                console.log('Webhook recibido sin payment ID:', ctx.request.body, ctx.query);
                ctx.status = 200;
                ctx.body = { received: true, message: 'No payment ID found' };
                return;
            }

            // Obtener información del pago desde Mercado Pago
            mpPayment = await mercadoPagoService.getPayment(paymentId);
            
            // Buscar el pago en nuestra base de datos usando external_reference
            const externalReference = mpPayment.external_reference;
            if (externalReference) {
                const payment = await Payment.findByPk(externalReference);
                
                if (payment) {
                    // Actualizar estado del pago
                    let status = 'pending';
                    if (mpPayment.status === 'approved') {
                        status = 'approved';
                    } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
                        status = 'rejected';
                    } else if (mpPayment.status === 'refunded') {
                        status = 'refunded';
                    }

                    await payment.update({
                        mercadoPagoPaymentId: paymentId.toString(),
                        mercadoPagoStatus: mpPayment.status,
                        status,
                    });

                    console.log(`Payment ${payment.id} updated to status: ${status}`);
                } else {
                    console.log(`Payment with external_reference ${externalReference} not found`);
                }
            } else {
                console.log(`Payment ${paymentId} has no external_reference`);
            }

            ctx.status = 200;
            ctx.body = { received: true };
        } catch (err) {
            console.error('Error processing webhook:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error al procesar el webhook' };
        }
    },

    /**
     * Verifica el estado de un pago
     */
    async verify(ctx) {
        try {
            const userId = auth.getUserIdFromToken(ctx);
            const { id } = ctx.params;

            const payment = await Payment.findOne({
                where: { id, userId },
            });

            if (!payment) {
                ctx.status = 404;
                ctx.body = { error: 'Pago no encontrado' };
                return;
            }

            // Si hay un payment_id de Mercado Pago, verificar el estado actual
            if (payment.mercadoPagoPaymentId) {
                try {
                    const mpPayment = await mercadoPagoService.getPayment(payment.mercadoPagoPaymentId);
                    
                    let status = payment.status;
                    if (mpPayment.status === 'approved' && payment.status !== 'approved') {
                        status = 'approved';
                    } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
                        status = 'rejected';
                    } else if (mpPayment.status === 'refunded') {
                        status = 'refunded';
                    }

                    await payment.update({
                        mercadoPagoStatus: mpPayment.status,
                        status,
                    });
                } catch (err) {
                    console.error('Error verifying payment with Mercado Pago:', err);
                }
            }

            ctx.body = payment;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error al verificar el pago' };
        }
    },
};

