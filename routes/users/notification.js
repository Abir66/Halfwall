require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const DB_follow = require('../../db-codes/users/db-follow-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const { response } = require('express');
const utils = require('../../routerControllers/utils.js');
const default_values = require('../../db-codes/default_values');
const DB_notification = require('../../db-codes/users/db-notification-api');
const constant_values = require('../../db-codes/constant_values');


router.get('/', verify, async (req, res) => {
    //console.log('heree', req.user.USER_ID, constant_values.notification_limit, req.query.last_notification_id );
    const notifications = await DB_notification.getNotificationForUser(req.user.USER_ID, constant_values.notification_limit, req.query.last_notification_id);
    res.send(notifications);
})


router.post('/clear', verify, async (req, res) => {
    await DB_notification.clearNotificationForUser(req.user.USER_ID, req.body.notification_id);
    res.send('success');
})


module.exports = router;