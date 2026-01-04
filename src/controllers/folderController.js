const { Folder } = require('../models');

module.exports = {
    async getAll(ctx) {
        try {
            const folders = await Folder.findAll();
            ctx.body = folders;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching folders' };
        }
    },

    async getById(ctx) {
        try {
            const folder = await Folder.findByPk(ctx.params.id);
            if (!folder) {
                ctx.status = 404;
                ctx.body = { error: 'Folder not found' };
                return;
            }
            ctx.body = folder;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching folder' };
        }
    },

    async create(ctx) {
        try {
            const { courseId, parentFolderId, name, studentVisible } = ctx.request.body;

            const folder = await Folder.create({
                courseId,
                parentFolderId,
                name,
                studentVisible
            });

            ctx.status = 201;
            ctx.body = folder;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { name, studentVisible, parentFolderId } = ctx.request.body;

            const folder = await Folder.findByPk(id);
            if (!folder) {
                ctx.status = 404;
                ctx.body = { error: 'Folder not found' };
                return;
            }

            await folder.update({ name, studentVisible, parentFolderId });
            ctx.body = folder;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const folder = await Folder.findByPk(id);
            if (!folder) {
                ctx.status = 404;
                ctx.body = { error: 'Folder not found' };
                return;
            }

            await folder.destroy();
            ctx.status = 204;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting folder' };
        }
    },

    async getRootFolders(ctx) {
        try {
            const { courseId } = ctx.params;
            const folders = await Folder.findAll({ where: { courseId, parentFolderId: null } });
            ctx.body = folders;
        } catch (err) {
            ctx.status = 500;
            console.log(err)
            ctx.body = { error: 'Error fetching folders for course' };
        }
    },

    async getSubfolders(ctx) {
        try {
            const { parentFolderId } = ctx.params;
            const folders = await Folder.findAll({ where: { parentFolderId } });
            ctx.body = folders;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching subfolders' };
        }
    }
};
