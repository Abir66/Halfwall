const button = document.getElementById("toast_click");
const toast = document.querySelector(".toast_notification");
const toast_text = document.getElementById("toast_notification_text");
const closeIcon = document.querySelector(".close");
const progress = document.querySelector(".progress");
let toast_flag  = false;

let timer1, timer2;

button.addEventListener("click", () => {
    let link = "https://www.google.com/";
    let image = "/images/pfp.jpg";
    showNotification("hello world my frien",link,image);
});

closeIcon.addEventListener("click", () => {
    toast.classList.remove("active");
    
    setTimeout(() => {
        progress.classList.remove("active");
        toast_flag = false;
    }, 300);

    clearTimeout(timer1);
    clearTimeout(timer2);
});

async function showNotification(text,link,image){
    if(toast_flag){
        toast.classList.remove("active");
        console.log("hello");
    }
    toast_flag = true;
    console.log(text,link,image);
    let image_link = "";
    let anchor_link = "";
    if(image)
        image_link = image;
    if(link)
        anchor_link = link;
    let image_tag = document.getElementById("toast_nofivication_image");
    image_tag.src = image;
    toast.href = anchor_link;
    toast.classList.add("active");
    progress.classList.add("active");
    toast_text.innerText = text;
    if(toast_flag){
        timer1 = setTimeout(() => {
            toast.classList.remove("active");
            toast_flag = false;
        }, 5000); //1s = 1000 milliseconds
    }
    if(toast_flag){
        timer2 = setTimeout(() => {
            progress.classList.remove("active");
            toast_flag = false;
        }, 5300);
    }
    

    
    
    
}




   

// css


