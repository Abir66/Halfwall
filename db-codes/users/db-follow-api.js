const Database = require('../database');
const database = new Database();


async function requestFollow(follower, following){
    console.log (follower, following);
    const sql =`INSERT INTO follow_requests
                VALUES (:follower, :following, CURRENT_TIMESTAMP)`;

    const binds={
        follower : follower,
        following : following
    }

    try{
        await database.execute(sql, binds);
        return binds;
    }catch(err){
        console.log(err);
    }
}

async function acceptFollow(follower, following){
    console.log (follower, following);
    const sql =`INSERT INTO follows
                VALUES (:follower, :following, CURRENT_TIMESTAMP)`;

    const binds={
        follower : follower,
        following : following
    }

    try{
        await database.execute(sql, binds);
        return binds;
    }catch(err){
        console.log(err);
    }
}


async function removeFollowRequest(follower, following){
    const sql =`DELETE FROM follow_requests
                WHERE follower_id = :follower AND followee_id = :following`;

    const binds={
        follower : follower,
        following : following
    }

    await database.execute(sql, binds);
    return binds;
}

async function removeFollow(follower, following){
    const sql =`DELETE FROM follows
                WHERE follower_id = :follower AND followee_id = :following`;

    const binds={
        follower : follower,
        following : following
    }

    await database.execute(sql, binds);
    return binds;
}

async function getFollowerCount(user_id){
    const sql = `SELECT count(*) as follower_count FROM follows 
                WHERE followee_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}


async function getFollowingCount(user_id){
    const sql = `SELECT count(*) as following_count FROM follows 
                WHERE follower_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function followedUser(follower_id, followee_id){
    const sql = `SELECT * FROM follows
                WHERE follower_id = :follower_id AND followee_id = :followee_id`;
    const binds ={
        follower_id : follower_id,
        followee_id : followee_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function requestedToFollowUser(follower_id, followee_id){
    const sql = `SELECT * FROM follow_requests
                WHERE follower_id = :follower_id AND followee_id = :followee_id`;
    const binds ={
        follower_id : follower_id,
        followee_id : followee_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}


async function getFollowRequestCount(user_id){
    const sql = `SELECT count(*) as follow_request_count FROM follow_requests
                WHERE followee_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result[0];
}

async function getFollowRequests(user_id){
    const sql = `SELECT follow_requests.FOLLOWER_ID USER_ID, TIMESTAMP, NAME, PROFILE_PIC 
                FROM follow_requests left join users on follow_requests.follower_id = users.USER_ID
                WHERE followee_id = :user_id`;
    const binds ={
        user_id : user_id
    };
    const result = (await database.execute(sql, binds)).rows;
    return result;
}


module.exports = {
    requestFollow,
    acceptFollow,
    removeFollowRequest,
    removeFollow,
    getFollowerCount,
    getFollowingCount,
    followedUser,
    requestedToFollowUser,
    getFollowRequestCount,
    getFollowRequests
}