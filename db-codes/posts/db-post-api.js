const Database = require('../database');
const database = new Database();
const default_values = require('../default_values');
const constant_values = require('../constant_values');

async function addLike(post_id, user_id){
    const sql = `INSERT INTO LIKES
                    VALUES(:user_id, :post_id, CURRENT_TIMESTAMP)`;
    
    const binds={
        user_id : user_id,
        post_id : post_id,
    }
    await database.execute(sql, binds);
    return;
}

async function removeLike(post_id, user_id, ){
    const sql = `DELETE FROM LIKES 
                WHERE USER_ID = :user_id AND post_id = :post_id`;
    
    const binds={
        user_id : user_id,
        post_id : post_id
    }
    await database.execute(sql, binds);
    return;
}


async function getLikesCount(post_id){
    const sql = `SELECT count(*) AS LIKES_COUNT
                FROM LIKES
                WHERE POST_ID = :post_id`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function checkUserLiked(post_id,user_id){
    const sql = `SELECT 1 AS USER_LIKED
                FROM LIKES
                WHERE POST_ID = :post_id and USER_ID = :user_id`;
    const binds = {
        post_id : post_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function getLikersList(post_id){
    
    const sql = `SELECT LIKES.USER_ID, USERS.NAME, NVL(USERS.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                FROM LIKES LEFT JOIN USERS ON LIKES.USER_ID = USERS.USER_ID
                WHERE POST_ID = :post_id
                ORDER BY TIMESTAMP DESC`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows;
    return result;

}

async function getGroupAndUserOfPost(post_id){
    
    const sql = `SELECT P.GROUP_ID, P.USER_ID, G.GROUP_NAME, G.GROUP_PRIVACY
                FROM POSTS P LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.POST_ID = :post_id`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function getPost(post_id, user_id){
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME",  NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                CURSOR(SELECT FILE_TYPE, FILE_LOCATION FROM POST_FILES PF WHERE PF.POST_ID = P.POST_ID) "FILES"

                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.POST_ID = :post_id`;

    const binds ={
        post_id : post_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows[0];
    return result;
}


async function getComments(post_id, limit, cursor_id){
    
    let limit_str = '', cursor_str = '';
    if(limit) limit_str = `FETCH FIRST ${limit} ROWS ONLY`;
    
    if(cursor_id) cursor_str = ` AND COMMENT_ID > ${cursor_id}`;
    const sql = `SELECT C.COMMENT_ID, C.POST_ID, C.TEXT, C.IMAGE, TO_CHAR(C.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                U.USER_ID, INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM COMMENTS C LEFT JOIN USERS U ON C.USER_ID = U.USER_ID
                WHERE C.POST_ID = :post_id
                ${cursor_str}
                ORDER BY C.TIMESTAMP ASC
                ${limit_str}`;

    const binds ={
        post_id : post_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}



async function createPost(user_id, post_data, files){

    const sql = `BEGIN
                    CREATE_POST(:user_id, :group_id, :text, :result, :post_id);
                END;`;

    const binds = {
        user_id : user_id,
        group_id : post_data.group_id,
        text : post_data.post_text,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        },
        post_id: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
        }
    }

    const result =  (await database.execute(sql, binds)).outBinds;

    if(result.result != 'success') return result;


    if(files.length > 0){
        let file_insert_sql = 'INSERT ALL';
        for(let file of files) {
            file_insert_sql += ` INTO POST_FILES (POST_ID, FILE_TYPE, FILE_LOCATION) VALUES(:post_id, '${file.file_type}', '${file.file_path}')`;
        }
        file_insert_sql += ' SELECT 1 FROM DUAL';
        const file_insert_binds = { post_id : result.post_id }
        await database.execute(file_insert_sql, file_insert_binds);
    }

    // // if group is marketplace
    if(post_data.group_id == constant_values.marketplace_group_id){
        const sql = `INSERT INTO SELL_POSTS (POST_ID, CATAGORY, PRICE, CONDITION, AVAILABLE) VALUES (:post_id, :catagory, :price, :condition, :available)`;
        const binds = {
            post_id : result.post_id,
            catagory : post_data.catagory,
            price : post_data.price,
            condition : post_data.condition,
            available : 'Yes'
        }
        await database.execute(sql, binds);
    }


    else if(post_data.group_id == constant_values.tuition_group_id){

        const sql = `INSERT INTO TUITION_POSTS (POST_ID, CLASS, REMUNERATION, STUDENT_COUNT, PREFERENCE) 
                    VALUES (:post_id, :class, :remuneration, :student_count, :preference)`;

        const binds = {
            post_id : result.post_id,
            class : post_data.class,
            remuneration : post_data.remuneration,
            student_count : post_data.student_count,
            preference : post_data.preference
        }

        await database.execute(sql, binds);


        // insert all subjects into tuition_subjects table
        if(post_data.subjects.length > 0){
            let subject_insert_sql = 'INSERT ALL';
            for(let subject of post_data.subjects) {
                subject_insert_sql += ` INTO TUITION_SUBJECTS (POST_ID, SUBJECT) VALUES(:post_id, '${subject}')`;
            }
            subject_insert_sql += ' SELECT 1 FROM DUAL';
            const subject_insert_binds = { post_id : result.post_id }
            await database.execute(subject_insert_sql, subject_insert_binds);
        }
    }
    
}


async function createComment(comment){
    const sql = `BEGIN
                    CREATE_COMMENT(:post_id, :user_id, :text, :image, :result, :comment_id);
                END;`;
    
    const binds = {
        post_id : comment.post_id,
        user_id : comment.user_id,
        text : comment.comment_text,
        image : comment.comment_image,
        result: {
            dir: oracledb.BIND_OUT,
            type: oracledb.VARCHAR2
        },
        comment_id: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
        }
    }

    
    const result =  (await database.execute(sql, binds)).outBinds;
    return result;

}

async function updateComment(comment_id,comment_text,image){
    const sql = `
    BEGIN
    UPDATE_COMMENT(:comment_id,:comment_text,:image)
    END
    `;
    const binds = {
        comment_text: comment_text,
        comment_id: comment_id,
        image: image,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }

    const result =  (await database.execute(sql, binds)).outBinds;
    return result;
}
async function getCommentByID(comment_id){
    const sql = `SELECT C.COMMENT_ID, C.POST_ID, C.TEXT, C.IMAGE, TO_CHAR(C.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                U.USER_ID, INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM COMMENTS C LEFT JOIN USERS U ON C.USER_ID = U.USER_ID
                WHERE C.COMMENT_ID = :comment_id`;

    const binds ={
        comment_id : comment_id
    };

    result = (await database.execute(sql,binds)).rows[0];
    
    return result;
}
async function deleteComment(comment_id){
    const sql = `
    BEGIN
        DELETE_COMMENT(:comment_id,:result);
    END;
    `;

    const binds = {
        comment_id:comment_id,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    result = (await database.execute(sql,binds)).outBinds;

    return result;
}
async function getCommentCount(post_id){
    const sql = `
        SELECT COUNT(*) AS N
        FROM COMMENTS
        WHERE POST_ID = :post_id
    `;

    const binds = {
        post_id:post_id
    }

    result = (await database.execute(sql,binds)).rows[0].N;
    return result;
}


module.exports = {
    addLike,
    removeLike,
    getLikesCount,
    checkUserLiked,
    getLikersList,
    getGroupAndUserOfPost,
    getPost,
    getComments,
    createPost,
    createComment,
    getCommentByID,
    deleteComment,
    getCommentCount,
    
}

