var express = require('express');
var Main = require('../Controllers/mainController');

var router = express.Router();
router.route('/').get(Main.GetIndex);
router.route('/company').get(Main.GetCompanies);
router.route('/company/:ticker').get(Main.GetCompany);
router.route('/*').get(Main.get404);
module.exports = router;
