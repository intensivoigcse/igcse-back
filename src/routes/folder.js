const Router = require('koa-router');
const folderController = require('../controllers/folderController');
const auth = require('../auth/auth');
const ownershipGuard = require('../auth/guards/ownershipGuard');
const router = new Router({ prefix: '/folder' });


router.get('/course/:courseId', auth.jwtAuth(), folderController.getRootFolders);
router.get('/parent/:parentFolderId', auth.jwtAuth(), folderController.getSubfolders);


router.get('/', auth.jwtAuth(), folderController.getAll);
router.get('/:id', auth.jwtAuth(), ownershipGuard.checkFolderOwnership(), folderController.getById);
router.post('/', auth.jwtAuth(), folderController.create);
router.patch('/:id', auth.jwtAuth(), folderController.update);
router.delete('/:id', auth.jwtAuth(), folderController.remove);

module.exports = router;