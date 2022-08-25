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


async function addComment(comment_list, comment, group_id){

    const comment_str = ` 
            <div class="comment">
                <div class="profile-picture">
                    <a href="/groups/group_id=${group_id}/user/user_id=${comment.USER_ID}"> <img src="/images/pfp.jpg" alt="pfp"> </a>
                </div>

                <div class="comment-body">
                    <div class="info">
                        <p class="comment-username"><a href="/groups/group_id=${group_id}/user/user_id=${comment.USER_ID}"> ${comment.USERNAME} </a>
                        <small class = "comment-time text-muted">${comment.TIMESTAMP}</small></p>
                    </div>
                
                    <div class="comment-text"><p>${comment.TEXT}</p></div>
                
                    ${comment.IMAGE ? `<div class="comment-image"><img src="${comment.IMAGE}" alt="comment-image"></div>` : ""}
                </div>
            </div>
            `;
    
        comment_list.innerHTML += comment_str;
}

async function showComments(group_id, post_id){
    
    const res = await axios.get("/posts/getComments/", {params : {post_id : post_id}});

    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    //update comments count of this post get element by class
    const comments_count = post.querySelector('.comments-count');
    comments_count.innerHTML = `${res.data.length} comments`;

    // set display of comments to block
    const comments = post.querySelector('.comments');
    comments.style.display = "block";
    
    // get the comments list
    const comments_list = post.querySelector('.comments-list');
    comments_list.innerHTML = "";

    if(res.data.length == 0){
        comments_list.innerHTML += `<div class = "no-comments">No comments yet</div>`;
        return;
    }

    
    for(let comment of res.data)  await addComment(comments_list, comment, group_id);
}


async function hideComments(post_id){
    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // set display of comments to none
    const comments = post.querySelector('.comments');
    comments.style.display = "none";
}
