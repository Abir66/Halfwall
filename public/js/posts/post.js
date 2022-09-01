// like post
var post_edit_modal = new bootstrap.Modal(document.getElementById('post-edit-modal'), {});

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

async function deletePost(post_id){
    console.log("delete post", post_id)
    const res = await axios.post(`/posts/delete/post_id=${post_id}`, {post_id: post_id});
    if(res.data === 'success') {
        // hide the post
        document.getElementById(`post-${post_id}`).style.display = "none";
    }
}

async function getLikersList(post_id){

    const res = await axios.get("/posts/getLikersList/", {params : {POST_ID : post_id}});
    const users = res.data;
    

    const modalBody = document.getElementById('user-modal').querySelector('.modal-body');
    const modalTitle = document.getElementById('user-modal').querySelector('.modal-title');
        
        modalTitle.innerHTML = `Likes : ${users.length}`;
        modalBody.innerHTML = "";

        for (let user of users) {
            const str = `<div class = "modal-userlist-users" id = "modal-userlist-user-${user.USER_ID}">
                            <div class = "modal-userlist-userinfo">
                                <a href="/user/user_id=${user.USER_ID}"  class="modal-userlist-userpic"><div class = "profile-picture"><img src="${user.PROFILE_PIC}"></div></a>
                                <a href="/user/user_id=${user.USER_ID}"  class="modal-userlist-username">${user.NAME}</a>
                            </div>
                        </div>`;
            modalBody.innerHTML += str;
        }
        user_modal.show();
}


document.querySelector('.create-post').addEventListener('submit', async (e) => {
    e.preventDefault();
} );


async function addDataInEditPost(post){

    // get the modal
    const modal = document.getElementById('post-edit-modal');

    // add post.TEXT in textarea
    const textarea = modal.querySelector('textarea');
    textarea.value = post.TEXT;

    // set post group
    const post_group = modal.querySelector('.post-group');
    let post_group_str = "";
    //if post.GROUP > 2 then show group name 
    if(post.GROUP > 2) post_group_str = `<p class="group-name text-muted">in ${post.GROUP_NAME}</p>`;
    
    // else show a dropdonw list of groups
    else{
        post_group_str = `
            <div class="form-group">
                <select name="privacy" id="post-privacy">
                    <option value="PRIVATE" ${post.GROUP_ID == 2 ? 'selected' : ''}>Followers only</option>
                    <option value="PUBLIC" ${post.GROUP_ID == 1 ? 'selected' : ''}>Public</option>
                </select>
            </div>
        `
    }

    post_group.innerHTML = post_group_str;

  
}


async function editPost(post_id){
    
    const res = await axios.get(`/posts/getPostData/post_id=${post_id}`);
    if(res.data.result !== 'success') return;

    const post = res.data.post;
    post.FILES = JSON.parse(post.FILES);
    console.log(post)
    addDataInEditPost(post);

    post_edit_modal.show();
}
