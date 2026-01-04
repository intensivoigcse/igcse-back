const Router = require('koa-router');
const submissionController = require('../controllers/submissionController');
const auth = require('../auth/auth');
const userRoles = require('../enums/userRoles');
const submissionGuard = require('../auth/guards/submissionGuard');
const assignmentGuard = require('../auth/guards/assignmentGuard');
const upload = require('../file_upload_utils/upload');
const router = new Router({ prefix: '/submissions' });

const maxFiles = 5;

router.get('/assignment/:assignmentId', auth.jwtAuth(), submissionController.getByAssignmentId);

router.get('/user/:userId', auth.jwtAuth(), submissionController.getByUserId);

router.get('/assignment/:assignmentId/user/:userId', auth.jwtAuth(), submissionController.getByAssignmentAndUser);

router.get('/', auth.jwtAuth(), submissionController.getAll);

router.get('/:id', auth.jwtAuth(), submissionGuard.checkSubmissionAccess('id', 'params'), submissionController.getById);

router.post('/', auth.jwtAuth(), assignmentGuard.checkAssignmentAccess('assignmentId', 'body') , submissionController.create);

router.patch('/:id', auth.jwtAuth(), submissionGuard.checkSubmissionAccess('id', 'params'), submissionController.update);

router.delete('/:id', auth.jwtAuth(), submissionGuard.checkSubmissionAccess('id', 'params'), auth.checkRole(userRoles.PROFESSOR), submissionController.remove);

router.post('/upload', auth.jwtAuth(), upload.array('files', maxFiles), assignmentGuard.checkAssignmentAccess('assignmentId', 'body'), submissionController.uploadSubmissions);

module.exports = router;