import express from 'express'
export const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Notes' });
});

router.get('/error', function(req, res, next) {
  next({
    status: 404,
    message: "Fake error"
  });
});
