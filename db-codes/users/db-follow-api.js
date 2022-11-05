const Database = require('../database');
const database = new Database();
const default_values = require('../default_values');


async function processFollow(follower, followee, action){
    console.log(follower, followee, action);
    const sql = `BEGIN
                    PROCESS_FOLLOW(:follower, :followee, :action, :result);
                END;`;

    const binds = {
        follower: follower,
        followee: followee,
        action: action,
        result: {
            dir: oracledb.BIND_OUT,
            type: oracledb.VARCHAR2
        }
    };

    return (await database.execute(sql, binds)).outBinds;
}



async function getFollowerCount(user_id){
    const sql = `SELECT count(*) as follower_count FROM follows 
                WHERE followee_id = :user_id
                AND status = 'FOLLOWING'`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}


async function getFollowerList(user_id){

    const sql = `SELECT follows.FOLLOWER_ID USER_ID, NAME, TIMESTAMP, NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM follows left join users on follows.follower_id = users.USER_ID
                WHERE followee_id = :user_id
                AND status = 'FOLLOWING'
                ORDER BY TIMESTAMP DESC`;

    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


async function getFollowingCount(user_id){
    const sql = `SELECT count(*) as following_count FROM follows 
                WHERE follower_id = :user_id
                AND status = 'FOLLOWING'`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getFollowingList(user_id){

    const sql = `SELECT follows.FOLLOWEE_ID USER_ID, NAME, TIMESTAMP, NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM follows left join users on follows.followee_id = users.USER_ID
                WHERE follower_id = :user_id
                AND status = 'FOLLOWING'
                ORDER BY TIMESTAMP DESC`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


async function followedUser(follower_id, followee_id){
    const sql = `SELECT * FROM follows
                WHERE follower_id = :follower_id AND followee_id = :followee_id
                AND status = 'FOLLOWING'`;
    const binds ={
        follower_id : follower_id,
        followee_id : followee_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result.length > 0;
}

async function requestedToFollowUser(follower_id, followee_id){
    const sql = `SELECT * FROM follows
                WHERE follower_id = :follower_id AND followee_id = :followee_id
                AND status = 'REQUESTED'`;
    const binds ={
        follower_id : follower_id,
        followee_id : followee_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}


async function getFollowRequestCount(user_id){
    const sql = `SELECT count(*) as follow_request_count FROM follows
                WHERE followee_id = :user_id
                AND status = 'REQUESTED'`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getFollowRequests(user_id){
    const sql = `SELECT follows.FOLLOWER_ID USER_ID, TIMESTAMP, NAME, NVL(users.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM follows left join users on follows.follower_id = users.USER_ID
                WHERE followee_id = :user_id
                AND status = 'REQUESTED'`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


module.exports = {
    getFollowerList,
    getFollowerCount,
    getFollowingCount,
    followedUser,
    requestedToFollowUser,
    getFollowRequestCount,
    getFollowRequests,
    getFollowingList,
    processFollow
}