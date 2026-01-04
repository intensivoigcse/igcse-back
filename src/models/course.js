const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        professor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        // Información adicional
        objectives: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requirements: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Clasificación (OBLIGATORIOS)
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        level: {
            type: DataTypes.ENUM('primero', 'segundo', 'tercero', 'cuarto_medio'),
            allowNull: false,
            defaultValue: 'primero',
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        // Temporal
        duration_hours: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // Capacidad
        max_students: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        modality: {
            type: DataTypes.ENUM('online', 'presencial', 'hybrid'),
            allowNull: true,
            defaultValue: 'online',
        },
        schedule: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Visual
        image_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        // Estado
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    }, {
        tableName: 'courses',
        timestamps: true,
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['level']
            },
            {
                fields: ['status']
            },
            {
                fields: ['professor_id']
            }
        ]
    });

    return Course;
};
