


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


async function addComment(comment_list, comment, group_id,currentUser_id){
    let div = "";
    if(currentUser_id === comment.USER_ID){ /// here need to add admin priviledges
        div = `<span onclick=deleteComment(${comment.COMMENT_ID},${comment.POST_ID})><i class="fa-solid fa-trash"></i></span>`;
    }

    const comment_str = ` 
            <div class="comment" id="comment-id-${comment.COMMENT_ID}">
                <div class="profile-picture">
                    <a href="/groups/group_id=${group_id}/user/user_id=${comment.USER_ID}"> <img src="${comment.PROFILE_PIC}" alt="pfp"> </a>
                </div>

                <div class="comment-body">
                    <div class="info">
                        <p class="comment-username"><a href="/groups/group_id=${group_id}/user/user_id=${comment.USER_ID}"> ${comment.USERNAME} </a>
                        <small class = "comment-time text-muted">${comment.TIMESTAMP}</small></p>
                    </div>
                    <div class="">
                        ${(!comment.TEXT || comment.TEXT == null) ? '' : '<div class="comment-data-portion"><div class="comment-text"><p>' + comment.TEXT + `</p></div>${div}</div>`}
                        
                    
                        ${comment.IMAGE ? `<div class="comment-data-portion"><div class="comment-image"><img src="${comment.IMAGE}" alt="comment-image"></div>${(!comment.TEXT || comment.TEXT == null) ? `${div}`:""}</div>` : ""}

                    </div>
                    
                </div>
            </div>
            `;

        comment_list.innerHTML += comment_str;
}

async function deleteComment(comment_id,post_id){
    console.log(comment_id," ",post_id);
    const result = (await axios.post('/posts/deleteComment',{comment_id:comment_id})).data.result;
    if(result.result === 'success'){
        const cmt = document.getElementById("comment-id-"+comment_id);
        cmt.remove();
        const count = (await axios.post('/posts/getCommentCount',{post_id:post_id})).data.result;
        let post_div = "comments-count-"+post_id;
        const count_div = document.getElementById(post_div);
        count_div.innerText = count+" comments";
    }
}

async function showComments(group_id, post_id, currentUserId){
    
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

    
    for(let comment of res.data)  await addComment(comments_list, comment, group_id,currentUserId);
}


async function hideComments(post_id){
    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // set display of comments to none
    const comments = post.querySelector('.comments');
    comments.style.display = "none";

    // clear the comments list
    const comments_list = post.querySelector('.comments-list');
    comments_list.innerHTML = "";
}

async function textarea_auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
}


// prevent default behaviour of all form submit


async function comment_image_preview(post_id){

    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // get the file input
    const file_input = post.querySelector('.comment-image-input');

    // get the input file
    const file = file_input.files[0];

    // get the image preview
    const image_preview = post.querySelector('.comment-image-preview');

    // clear the image preview
    image_preview.innerHTML = "";

    // if file is an image
    if (file.type.match("image.*")) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let img = document.createElement("img");
            img.src = e.target.result;
            image_preview.appendChild(img);

            // add a close button
            let close_button = document.createElement("i");
            close_button.className = "fa-solid fa-rectangle-xmark comment-image-close";
            close_button.onclick = function(){
                image_preview.innerHTML = "";
                file_input.value = "";
            }

            image_preview.appendChild(close_button);
        }
        reader.readAsDataURL(file);
    }
}


document.querySelector('.create-post').addEventListener('submit', async (e) => {
    e.preventDefault();
    
} );


async function send_comment(post_id, group_id,currentUser_id){
    
    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // get the comment form data
    const form_data = new FormData(post.querySelector('.comment-form'));
    // get comment-text value
    const comment_text = form_data.get('comment_text_input');

    // check if both image and input is empty
    if(form_data.get('comment_image').name == "" && (!comment_text || comment_text.trim()===''))return;


    //close image preview
    const image_preview = post.querySelector('.comment-image-preview');
    image_preview.innerHTML = "";

    // clear comment_text_input
    const comment_text_input = post.querySelector('.comment-text-input');
    comment_text_input.value = "";

    let res;

    try{
        res = await axios({
            method: 'post',
            url: `/posts/post_id=${post_id}/comment`,
            data: form_data,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }catch(err){
    
    }

    // clear files
    const file_input = post.querySelector('.comment-image-input');
    file_input.value = "";


    if(res.data.result != 'success'){
        alert('Couldn\'t send comment');
        return;
    }


    // increment comments count
    const comments_count = post.querySelector('.comments-count');
    console.log("before", comments_count.innerHTML);
    const comments_count_value = parseInt(comments_count.innerHTML.trim().split(' ')[0]);
    comments_count.innerHTML = `${comments_count_value + 1} comments`;
    console.log("after", comments_count.innerHTML);



    // set display of comments to block
    const comments = post.querySelector('.comments');
    comments.style.display = "block";
    
    // get the comments list
    const comments_list = post.querySelector('.comments-list');
    

    // add comment to the list
    await addComment(comments_list, res.data.comment, group_id,currentUser_id);

}