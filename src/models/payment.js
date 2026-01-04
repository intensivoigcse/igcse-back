const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Monto en CLP (pesos chilenos)',
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: 'Donación',
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded'),
            allowNull: false,
            defaultValue: 'pending',
        },
        mercadoPagoPreferenceId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID de la preferencia de pago en Mercado Pago',
        },
        mercadoPagoPaymentId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'ID del pago en Mercado Pago',
        },
        mercadoPagoStatus: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Estado del pago en Mercado Pago',
        },
    }, {
        tableName: 'payments',
        timestamps: true,
    });

    return Payment;
};

