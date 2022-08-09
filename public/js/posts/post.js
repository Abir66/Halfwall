// like post
async function like(post_id){
    console.log('like')
    const res = await axios.post(`/posts/like/post_id=${post_id}`, {post_id: post_id});
    fixLikes(res.data, post_id);
}

// unlike post
async function unlike(post_id){
    console.log("unlike")
    const res = await axios.post(`/posts/unlike/post_id=${post_id}`, {post_id: post_id});
    fixLikes(res.data, post_id);
}

// helper of like and unlike
function fixLikes(data, post_id){
    document.getElementById(`likes-count-${post_id}`).innerHTML = data.likes_count;
    if(data.user_liked) document.getElementById(`like-button-${post_id}`).innerHTML = `<i class="fa-solid fa-heart" style="color: rgb(243, 55, 89);" onclick="unlike(${post_id})"></i>`
    else document.getElementById(`like-button-${post_id}`).innerHTML = `<i class="fa-regular fa-heart" onclick="like(${post_id})"></i>` 
}

async function getLikersList(post_id){

    const res = await axios.get("/posts/getLikersList/", {params : {POST_ID : post_id}});
    const users = res.data;
    

    const modalBody = document.getElementById('user-modal').querySelector('.modal-body');
    const modalTitle = document.getElementById('user-modal').querySelector('.modal-title');
        
        modalTitle.innerHTML = `Likes : ${users.length}`;
        modalBody.innerHTML = "";

        for (let i = 0; i < users.length; i++) {

            let user_name = users[i].NAME;
            let user_id = users[i].USER_ID;

            const str = `<div class = "modal-userlist-users" id = "modal-userlist-user-${user_id}">
                            <div class = "modal-userlist-userinfo">
                                <a href="/user/user_id=${user_id}"  class="modal-userlist-userpic"><div class = "profile-picture"><img src="/images/pfp.jpg"></div></a>
                                <a href="/user/user_id=${user_id}"  class="modal-userlist-username">${user_name}</a>
                            </div>
                        </div>`;
            modalBody.innerHTML += str;
        }
        user_modal.show();
}