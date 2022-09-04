const Database = require('../database');
const database = new Database();
const {notification_sender} = require('../../middlewares/socketConnect');
const default_values = require('../default_values');

async function sendNotification(){

    const sql = `SELECT N.NOTIFICATION_ID, N.RECEIVER_ID, N.SENDER_ID, N.LINK, N.TEXT, N.NOTIFICATION_TYPE, N.TIMESTAMP,
                INITCAP(U.NAME) USERNAME, NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM NOTIFICATIONS N LEFT JOIN USERS U ON N.SENDER_ID = U.USER_ID
                WHERE N.SENT = 'NO'
                ORDER BY N.NOTIFICATION_ID ASC`;
    
    const result = (await database.execute(sql)).rows;
    
    if(result.length > 0){
        const first_notification_id = result[0].NOTIFICATION_ID;
        const last_notification_id = result[result.length - 1].NOTIFICATION_ID;

        const sql = `UPDATE NOTIFICATIONS
                    SET SENT = 'YES'
                    WHERE NOTIFICATION_ID >= :first_notification_id
                    AND NOTIFICATION_ID <= :last_notification_id`;
        const binds ={
            first_notification_id : first_notification_id,
            last_notification_id : last_notification_id
        };
        await database.execute(sql, binds);
        
        
        //send the notifications
        notification_sender(result);
    }


}


async function getNotificationForUser(user_id, limit, cursor_id){

    let limit_str = '', cursor_str = '';
    if(limit) limit_str = `FETCH FIRST ${limit} ROWS ONLY`;
    
    if(cursor_id) cursor_str = ` AND NOTIFICATION_ID > ${cursor_id}`;

    const sql = `SELECT N.NOTIFICATION_ID, N.RECEIVER_ID, N.SENDER_ID, N.LINK, N.TEXT, N.NOTIFICATION_TYPE, N.TIMESTAMP,
                INITCAP(U.NAME) USERNAME, NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM NOTIFICATIONS N LEFT JOIN USERS U ON N.SENDER_ID = U.USER_ID
                WHERE N.RECEIVER_ID = :user_id
                ${cursor_str}
                ORDER BY N.TIMESTAMP DESC
                ${limit_str}`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    
    return result;
}


async function getNotificationCountForUser(user_id){

    const sql = `SELECT COUNT(*) COUNT FROM NOTIFICATIONS
                WHERE RECEIVER_ID = :user_id
                AND SENT = 'NO'`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0].COUNT;
}

async function clearNotificationForUser(user_id, notification_id){
    const sql = `DELETE FROM NOTIFICATIONS
                WHERE RECEIVER_ID = :user_id
                AND NOTIFICATION_ID = :notification_id`;
    const binds ={
        user_id : user_id,
        notification_id : notification_id
    };
    await database.execute(sql, binds);
}

async function clearAllNotificationForUser(user_id, last_notification_id){
    const sql = `DELETE FROM NOTIFICATIONS
                WHERE RECEIVER_ID = :user_id
                AND NOTIFICATION_ID <= :last_notification_id`;
    const binds ={
        user_id : user_id,
        last_notification_id : last_notification_id
    };
    await database.execute(sql, binds);
}


async function sendTuitionNotification(receivers, post_id, sender){

    const text = 'There is a new post in tuition that might interest you.';
    const link = `/posts/post_id=${post_id}`;

    let notification_insert_sql = 'INSERT ALL';
    for(let receiver of receivers){
        notification_insert_sql += ` INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, LINK, TEXT, NOTIFICATION_TYPE, TYPE_ID)
                                    VALUES(${receiver}, :sender_id, :link, :text, :notification_type, :type_id)`;
    }

    notification_insert_sql += ' SELECT 1 FROM DUAL';
    const notification_insert_binds = {
        sender_id : sender,
        link : link,
        text : text,
        notification_type : 'POST',
        type_id : post_id
    }

    await database.execute(notification_insert_sql, notification_insert_binds);
    sendNotification();
}


module.exports = {
    sendNotification,
    getNotificationForUser,
    getNotificationCountForUser,
    clearNotificationForUser,
    clearAllNotificationForUser,
    sendTuitionNotification
};