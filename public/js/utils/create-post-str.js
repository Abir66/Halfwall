async function createPostStr(post) {
  post_str = `
  
  <div class="post" id="post-${post.POST_ID}">

  <div class="head">
      <div class="user">
          <div class="profile-picture">
      <a href="/groups/group_id=${post.GROUP_ID}/user/user_id=${post.USER_ID}"> <img src="${post.PROFILE_PIC}" alt="${post.USERNAME}"> </a>
      
  </div>
  <div class="ingo">
      <p class="username"><a href="/groups/group_id=${post.GROUP_ID}/user/user_id=${post.USER_ID}"> ${post.USERNAME} </a>
      ${post.GROUP_ID > 2 ? ' > <a href="/groups/group_id='+post.GROUP_ID+'">'+ post.GROUP_NAME +'</a>' : '' }
      </p>
      <small>${post.TIMESTAMP}
      ${post.GROUP_ID !== 2 ? '<i class="fa-sharp fa-solid fa-earth-americas"></i>' : '<i class="fa-solid fa-user-group"></i>'} 
      </small>

  </div>
</div>
<span class="edit dropdown show">
  
  <button class="fa-solid fa-ellipsis dropdown-toggle" style="background-color: transparent;" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
  
     <div class="dropdown-menu" aria-labelledby="dropdownMenuLink"> 
      <a id="copy-link" class="dropdown-item" href="#"><i class="fa-solid fa-link"></i> &nbsp Copy Link</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#" onclick="editPost(${post.POST_ID})"><i class="fa-solid fa-pen-to-square"></i> &nbsp Edit Post</a>
          <a class="dropdown-item" href="#" onclick="deletePost(${post.POST_ID})"><i class="fa-solid fa-trash"></i>&nbsp Delete Post</a>
    </div> 
</span>
</div>`

  if(post.GROUP_ID === 4){
      post_str += `
      <div class="marketplace-info-container">
          <div class="product-info"><strong>Catagory : </strong>${post.CATAGORY}</div>
          <div class="product-info"><strong>Condition : </strong>${post.CONDITION}</div>
          <div class="product-info"><strong>Price : </strong>${post.PRICE}</div>
          <div class="product-info"><strong>Available : </strong>${post.AVAILABLE}</div>
      </div>
      `
  }

  else if(post.GROUP_ID === 5){
      post_str += `
      <div class="marketplace-info-container">
          <div class="product-info"><strong>Class : </strong>${post.CLASS}</div>
          <div class="product-info"><strong>Subjects : </strong>${post.SUBJECTS.map( a => a.SUBJECT).join(', ')}</div>
          <div class="product-info"><strong>Location : </strong>${ post.LOCATION}</div>
          <div class="product-info"><strong>Renumeration : </strong>${ post.REMUNERATION }</div>
          ${post.STUDENT_COUNT > 1 ? '<div class="product-info"><strong>Students : </strong>' + post.STUDENT_COUNT + '</div>' : ''}
          ${post.PREFERENCE != 'N/A' ?  '<div class="product-info"><strong>Preference : </strong>' + post.PREFERENCE + '</div>' :''}
          ${post.BOOKED==='Yes' ?  '<div class="product-info"><strong style="color: var(--color-danger);">Booked</strong></div>' : '' }
      </div>
      `
  }


  post_str +=`<div class="post-text">
                  <p>${post.TEXT != null ? post.TEXT : ''}</p>
              </div> `

  if (post.FILES && post.FILES != null) {
      post.FILES = JSON.parse(post.FILES);
      console.log(post.FILES);

      post_str +=`
      <div id="imageSlider${post.POST_ID}" class="carousel slide" data-ride="carousel">
          <div class="container-fluid">
              <div class="carousel-indicators">`


  for( let index=0; index < post.FILES.length; index++ )
      post_str += `<button type="button" data-bs-target="#imageSlider${post.POST_ID}" data-bs-slide-to="${index}" ${index == 0 ? ' class="active" ' : ''} ></button>`
         
      post_str += `</div>
      <div class="carousel-inner"> `

      for( let index=0; index < post.FILES.length; index++ ){
          if(post.FILES[index].FILE_TYPE === 'IMAGE'){
              post_str += `
              <div class="carousel-item ${index == 0 ? ' active ' : ''}  ">
                  <div class="photo"><img src=${post.FILES[index].FILE_LOCATION} alt="POST_IMAGE"></div>
              </div>   `
          }

          else if(post.FILES[index].FILE_TYPE === 'VIDEO'){
              post_str += `
              <div class="carousel-item ${index == 0 ? ' active ' : ''}  ">
                      <video class = "video" controls><source src= ${post.FILES[index].FILE_LOCATION} type="video/mp4" ></video>
              </div>   `
          }
      }

      post_str += `
              </div>
              <a  href="#imageSlider${post.POST_ID}" class="carousel-control-prev" role="button" data-bs-slide="prev"></a>
              <a  href="#imageSlider${post.POST_ID}" class="carousel-control-next" role="button" data-bs-slide="next"></a>
          </div>
      </div>
      `
  }

post_str += `
      <div class="action-buttons">
          <div class="interaction-buttons">
              <span class = like-button id="like-button-${post.POST_ID}">
                  ${post.USER_LIKED === 1 ? '<i class="fa-solid fa-heart" style="color: rgb(243, 55, 89);" onclick="unlike('+post.POST_ID+')" ></i>'
                  : '<i class="fa-regular fa-heart" onclick="like('+ post.POST_ID+ ')"></i>'}
              </span>
              <span class="likes-count icon-pointer" id="likes-count-${post.POST_ID}" onclick="getLikersList(${post.POST_ID})"  >${post.LIKES_COUNT} </span>
          </div>
          <div class="comments-count" id="comments-count-${post.POST_ID}" onclick="showComments(${post.GROUP_ID}, ${post.POST_ID},<%=currentUser.USER_ID%>)">
          ${ post.COMMENT_COUNT} comments
          </div>
      </div>

      <hr>
      <div class="comments" style="display: none;">

          <p class="hide-comments" onclick="hideComments(${post.POST_ID})">Hide comments</p>

          <div class="comments-list">
          
          </div>
      
          <div class = "no-comments" style="display: none;">No comments yet</div>
      
          <div class="load-more-comments" onclick="showComments(${post.GROUP_ID}, ${post.POST_ID},<%=currentUser.USER_ID%>, true)">
              Load more comments
          </div>
      </div>




      <div class="comment-image-preview" id="comment-image-preview-${post.POST_ID}"></div>

      <div class="add-comment">
          <form action="" class="comment-form">
              <!-- comment attach preview  -->
              <div class="comment-image-preview-container">
                  <input type="file" name="comment_image" class="comment-image-input" id="comment-image-file-input-${post.POST_ID}" accept="image/png, image/jpeg" onchange="comment_image_preview(${post.POST_ID})" hidden>
              </div>
              <label for="comment-image-file-input-${post.POST_ID}" class="comment-attach-image-button"><i class="fa-solid fa-image"></i></label>
              <textarea class = "comment-text-input" name="comment_text_input" rows="1" placeholder="Write a comment..." oninput="textarea_auto_grow(this)" ></textarea>
              <div class="comment-submit" onclick="send_comment(${post.POST_ID}, ${post.GROUP_ID}, ${post.USER_ID})"><i class="fa-solid fa-paper-plane"></i></div>
          </form>
      </div>
</div>  
  `;

return post_str;
}
