
var comment_modal = new bootstrap.Modal(document.getElementById('comment-edit-modal'), {});
let remove_current_comment_image = false;
let current_comment_edit_id = -1;
let current_comment_edit_post_id = -1;


async function addComment(comment_list, comment, group_id,currentUser_id, add_to_top){
    let div = "";
    console.log(comment.COMMENT_ID, comment.USER_ID);
    if(currentUser_id === comment.USER_ID){ 
        div = `
        <span class="edit dropdown show icon_pointer">
                <button class="fa-solid fa-ellipsis dropdown-toggle" style="background-color: transparent;" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
                
                <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                    <div id="delete-comment" class="dropdown-item" onclick=deleteComment(${comment.COMMENT_ID},${comment.POST_ID})><i class="fa-solid fa-trash"></i> &nbsp Delete</div>
                    <div id="edit-comment" class="dropdown-item" onclick=editComment(${comment.COMMENT_ID},${comment.POST_ID})><i class="fa-solid fa-pen-to-square"></i> &nbsp Edit Comment</div>
                </div>
        </span>
        `;
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

        if(!add_to_top) comment_list.innerHTML += comment_str;
        else comment_list.innerHTML = comment_str + comment_list.innerHTML;
}


async function deleteComment(comment_id,post_id){

    const res = await axios.post(`/posts/deleteComment/comment_id=${comment_id}`, {});
    if(res.data === 'success'){
        const cmt = document.getElementById("comment-id-"+comment_id);
        cmt.remove();
        

        const post = document.getElementById("post-"+post_id);
        
        const comments_count = post.querySelector('.comments-count');
        const current_comments_count = parseInt(comments_count.innerText.split(' ')[0]);
            comments_count.innerText = (current_comments_count - 1) + " comments";
    }
}

async function editComment(comment_id,post_id){
    current_comment_edit_id = comment_id;
    current_comment_edit_post_id = post_id;
    const comment_data = (await axios.post('/posts/getCommentById',{comment_id:comment_id})).data.result;
    const comment_text = document.getElementById("edit-comment-in-modal");
    comment_text.value = comment_data.TEXT;
    loadCommentImage(comment_data);
    comment_modal.show();
}

async function close_comment_picture_update(resetForm = true){
    
    document.getElementById('comment-image-preview').innerHTML = '';
    
    // clear form
    if(resetForm) document.getElementById('comment-edit-form').reset();
    remove_current_comment_image = false;
    current_comment_edit_id = -1;
    current_comment_edit_post_id = -1;
}


async function loadCommentImage(comment){

        const image_preview = document.getElementById(`comment-image-preview`)
        image_preview.innerHTML = "";
        remove_current_comment_image = false;
        if(!comment.IMAGE) return;
        let div = document.createElement("div");
        div.classList.add("comment-image-container-inside-modal")
        let img = document.createElement("img");
        img.classList.add("comment-image-priview-design")
        img.src = comment.IMAGE;
        div.appendChild(img);
        image_preview.appendChild(div);
        // add a close button
        let imageRemoveContainer = document.createElement('div');
        imageRemoveContainer.classList.add("comment-picture-preview-remove");
        let close_button = document.createElement("i");
        close_button.className = `fa-solid fa-xl fa-circle-xmark `;
        imageRemoveContainer.appendChild(close_button);
        close_button.onclick = function(){
            image_preview.innerHTML = "";
            remove_current_comment_image = true;
        }
        div.appendChild(imageRemoveContainer);
        
}

async function comment_image_upload_image_preview(){
    
    const file_input = document.getElementById(`comment-image-file-input`);
    const file = file_input.files[0];
    const image_preview = document.getElementById(`comment-image-preview`)
    image_preview.innerHTML = "";
    remove_current_comment_image = true;
    // if file is an image
    if (file.type.match("image.*")) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let div = document.createElement("div");
            div.classList.add("comment-image-container-inside-modal")
            let img = document.createElement("img");
            img.classList.add("comment-image-priview-design")
            img.src = e.target.result;
            div.appendChild(img);
            image_preview.appendChild(div);
            // add a close button
            let profileRemoveContainer = document.createElement('div');
            profileRemoveContainer.classList.add("comment-picture-preview-remove");
            let close_button = document.createElement("i");
            close_button.className = `fa-solid fa-xl fa-circle-xmark `;
            profileRemoveContainer.appendChild(close_button);
            close_button.onclick = function(){
                image_preview.innerHTML = "";
                file_input.value = "";
            }

            div.appendChild(profileRemoveContainer);
        }
        reader.readAsDataURL(file);
    }
}

async function update_comment(){
    
    let comment_text = document.getElementById("edit-comment-in-modal").value;
    let form_data;
    
    const form = document.getElementById(`comment-edit-form`);
    form_data = new FormData(form);
    
    // append comment text
    form_data.append('comment_text',comment_text);
    form_data.append('comment_id',current_comment_edit_id);
    form_data.append('post_id',current_comment_edit_post_id);
    form_data.append('remove_image', remove_current_comment_image);
    close_comment_picture_update(false);

    let res;
    try{
        res = await axios({
            method: 'post',
            url: `/posts/update-comment`,
            data: form_data,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }catch(err){
        
    }

    // reset form
    document.getElementById('comment-edit-form').reset();

    if(res.data.result === 'success') {
        comment_modal.hide();
        const comment = res.data.comment;
        const comment_div = document.getElementById(`comment-id-${comment.COMMENT_ID}`);
        comment_div.innerHTML = "";
        addComment(comment_div, comment, comment.GROUP_ID, comment.USER_ID, false);

        showToastNotification('Notification', 'Comment updated', `/posts/post_id=${res.data.comment.POST_ID}/comment/comment_id=${res.data.comment.COMMENT_ID}`);
    }
    else alert(res.data);

   
}

async function showComments(group_id, post_id, currentUserId, load_more = false){
    
    const params = {post_id: post_id};

    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // get the comments list of this post
    const comments_list = post.querySelector('.comments-list');
    
    // show load more comments button
    const load_more_comments = post.querySelector('.load-more-comments');
    load_more_comments.style.display = 'block';

    // hide no more comments
    const no_more_comments = post.querySelector('.no-comments');
    no_more_comments.style.display = 'none';


    if(load_more){
        // get the last element in the comment list
        const last_comment = comments_list.lastElementChild;
        const last_comment_id = last_comment.id.split('-')[2];
        params.last_comment_id = last_comment_id;
    }

    else comments_list.innerHTML = "";

    // get the comments
    const res = await axios.get("/posts/getComments/", {params : params});

    //update comments count of this post get element by class
    const comments_count = post.querySelector('.comments-count');
    const current_comments_count = parseInt(comments_count.innerText.split(' ')[0]);
    const current_comments_list_length = comments_list.childElementCount;
    if(current_comments_list_length + res.data.length > current_comments_count)
            comments_count.innerText = current_comments_count + res.data.length + " comments";
   

    
    // set display of comments to block
    const comments = post.querySelector('.comments');
    comments.style.display = "block";
    
    if(res.data.length == 0){
        // hide load more button if no more comments
        if(load_more){
            const load_more_btn = post.querySelector('.load-more-comments');
            load_more_btn.style.display = "none";
        }

        // show no comments
        const no_comments = post.querySelector('.no-comments');
        no_comments.style.display = "block";
    }

    
    for(let comment of res.data)  await addComment(comments_list, comment, group_id,currentUserId);
}


async function hideComments(post_id){
    // get the post element
    const post = document.getElementById(`post-${post_id}`);

    // set display of comments to none
    const comments = post.querySelector('.comments');
    comments.style.display = "none";

    // set display of load more button to none
    const load_more_btn = post.querySelector('.load-more-comments');
    load_more_btn.style.display = "none";

    // set display of no comments to none
    const no_comments = post.querySelector('.no-comments');
    no_comments.style.display = "none";

    // clear the comments list
    const comments_list = post.querySelector('.comments-list');
    comments_list.innerHTML = "";
}

async function textarea_auto_grow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight)+"px";
}



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
    const comments_count_value = parseInt(comments_count.innerHTML.trim().split(' ')[0]);
    comments_count.innerHTML = `${comments_count_value + 1} comments`;




    // set display of comments to block
    const comments = post.querySelector('.comments');
    comments.style.display = "block";
    
    // get the comments list
    const comments_list = post.querySelector('.comments-list');
    

    // add comment to the list
    await addComment(comments_list, res.data.comment, group_id,currentUser_id, true);

}

showInitialComment();