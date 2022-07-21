const Database = require('../database');
const database = new Database();


async function follow(follower, following){
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

async function unfollow(follower, following){
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



module.exports = {
    follow,
    unfollow,
    getFollowerCount,
    getFollowingCount,
    followedUser
}