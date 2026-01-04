const Router = require('koa-router');
const assignmentController = require('../controllers/assignmentController');
const auth = require('../auth/auth');
const userRoles = require('../enums/userRoles');
const courseAccessGuard = require('../auth/guards/courseAccessGuard');
const assignmentGuard = require('../auth/guards/assignmentGuard');
const router = new Router({ prefix: '/assignments' });

router.get('/course/:courseId', auth.jwtAuth(), courseAccessGuard.checkCourseAccess('params', 'courseId') , assignmentController.getByCourseId);
router.get('/', auth.jwtAuth(), assignmentController.getAll);
router.get('/:id', auth.jwtAuth(), 
            assignmentGuard.checkAssignmentAccess('id'),
            assignmentController.getById);

router.post('/', auth.jwtAuth(),
             courseAccessGuard.checkCourseAccess('body', 'course_id'),
             auth.checkRole(userRoles.PROFESSOR), 
             assignmentController.create);

router.patch('/:id', auth.jwtAuth(), 
            assignmentGuard.checkAssignmentAccess('id'), 
            auth.checkRole(userRoles.PROFESSOR),
            assignmentController.update);

router.delete('/:id', auth.jwtAuth(), 
                assignmentGuard.checkAssignmentAccess('id'), 
                auth.checkRole(userRoles.PROFESSOR),
                assignmentController.remove);

module.exports = router;