const Router = require('koa-router');
const documentController = require('../controllers/documentController');
const auth = require('../auth/auth');
const upload = require('../file_upload_utils/upload');


const router = new Router({ prefix: '/documents' });


router.get('/', auth.jwtAuth(), documentController.getAll);
router.get('/:id', auth.jwtAuth(), documentController.getById);
router.patch('/:id', auth.jwtAuth(), documentController.update);
router.delete('/:id', auth.jwtAuth(), documentController.remove);

router.get('/course/:courseId', auth.jwtAuth(), documentController.getRootDocuments);
router.get('/folder/:folderId', auth.jwtAuth(), documentController.getByFolderId);
router.post('/upload', auth.jwtAuth(), upload.single('file'), documentController.uploadDocument);

module.exports = router;