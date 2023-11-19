var _post,
    _comment,
    _loader; 
const commentUser = 'anonymous';
var apiDomain = 'https://forum-api-5eb78.web.app',
    localApiDomain = 'http://127.0.0.1:3000';

window.addEventListener('load', () => {
    const formElements = refreshElements();

    _post = new Post();
    _comment = new Comment();
    _loader = new Loader();

    _post.getAll(formElements, _comment);

    //events
    formElements.formSubmit.addEventListener('click', (e) => _post.addPost(e, formElements, _comment));
});

class Post {
    constructor() {
        
    }

    getAll(formElements) {
        try {
            _loader.showLoader();
            fetch(`${apiDomain}/post`)
                .then(response => response.json().then(data => ({
                    data: data,
                    status: response.status
                }))
                .then(res => {
                    let posts = res.data;

                    if(posts.length > 0) {
                        formElements.forumEntries.innerHTML = null;

                        for (let i = 0; i < posts.length; i++) {
                            var date = Date.parse(posts[i].date_created);
                            formElements.forumEntries.innerHTML += 
                            `<li class="forum-list-item">
                                <div class="forum-post">
                                    <div class="forum-image">
                                        <img src="${posts[i].image_url}" alt="forum image"/>
                                    </div>
                                    <div class="forum-text">
                                        <strong>${posts[i].name}</strong> 
                                        <br/>
                                        <p>${posts[i].date_created}</p>
                                        <br/>
                                        <p>${posts[i].description}</p> 
                                    </div>
                                </div>
                                <hr/>
                                <h3>Comments</h3>
                                <ul id="forum-comments-${posts[i].id}">
                                </ul>
                                <hr/>
                                <div class="forum-comment-box">
                                    <textarea id="forum-comment-box-text-${posts[i].id}" name="message" placeholder="Add a comment." style="width: 70%;"></textarea><br/>
                                    <input aria-post-id="${posts[i].id}" class="forum-comment-box-button" type="submit" value="Add comment"/>
                                </div>
                            </li>`;

                            _comment.getAllComments(posts[i].id);
                        }
                        _comment.addCommentEvent();
                    }
                    else {
                        formElements.forumEntries.innerHTML += 
                            `<li class="forum-list-item">
                                <p>No available posts.</p>
                            </li>`;
                    }

                    _loader.hideLoader();
                })
                .catch(error => {
                    _comment.addCommentEvent();
                    console.log('no posts available.');
                    _loader.hideLoader();
                })
            );
        }
        catch(error) {
            formElements.forumEntries.innerHTML = 
                `<li class="forum-list-item">
                    <p>Error getting posts.</p>
                </li>`;
        }
        
    }

    clearForm() {
        var formElements = refreshElements();
        formElements.formName.value = '';
        formElements.formDescription.value = '';
        formElements.formFile.value = '';
    }

    addPost(e, formElements) {
        e.preventDefault();
        
        const formData  = new FormData();
        formData.append('name', formElements.formName.value);
        formData.append('description', formElements.formDescription.value);
        formData.append('file', formElements.formFile.files[0]);

        _loader.showLoader();
        fetch(`${apiDomain}/post/create`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(response => {
            this.clearForm(); 
            this.getAll(refreshElements(), _comment);
            _loader.hideLoader();
        });
    }
}

class Comment {
    constructor() {
        
    }

    getAllComments(postId) {
        fetch(`${apiDomain}/comment/${postId}`)
            .then(response => response.json().then(data => ({
                data: data,
                status: response.status
            }))
            .then(res => {
                let comments = res.data.comments;

                if(comments.length > 0) {
                    let commentSection = document.getElementById(`forum-comments-${postId}`);
                    commentSection.innerHTML = '';

                    for (let i = 0; i < comments.length; i++) {
                        commentSection.innerHTML += `<li class="forum-comment-item">
                            <strong>${comments[i].name}:</strong> ${comments[i].comment} <span class="forum-comment-timeago">(${moment(Date.parse(comments[i].date_created)).fromNow()})</span>
                        </li>`
                    }
                }
                
                _loader.hideLoader();
            })
            .catch(error => {
                console.log('no comments available.');
                _loader.hideLoader();
            })
        );
    }

    clearForm(postId) {
        let commentBox = document.getElementById(`forum-comment-box-text-${postId}`);
        commentBox.value = '';
    }

    addCommentEvent() {
        var commentSubmits = document.querySelectorAll(`.forum-comment-box-button`);

        commentSubmits.forEach((commentSubmit, index) => {
            commentSubmit.addEventListener('click', (e) => this.addComment(e))
        })
    }

    addComment(e) {
        e.preventDefault();

        var postId = e.currentTarget.getAttribute('aria-post-id'),
            textValue = document.getElementById(`forum-comment-box-text-${postId}`).value;
        
        const formData  = new FormData();
        formData.append('name', commentUser);
        formData.append('comment', textValue);
        formData.append('post_id', postId);

        _loader.showLoader();
        fetch(`${apiDomain}/comment/create`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(response => {
            this.clearForm(postId);
            this.getAllComments(postId);
        });

    }
}

class Loader {
    constructor() {
        this.loader = document.getElementById('forum-loader');
    }

    showLoader() {
        if(this.loader.classList.contains('hidden')) {
            this.loader.classList.remove('hidden');
        }
    }

    hideLoader() {
        if(!this.loader.classList.contains('hidden')) {
            this.loader.classList.add('hidden');
        }
    }
}


function refreshElements() {
    return {
        formEntry: document.getElementById('forum-entry'),
        forumEntries: document.getElementById('forum-entries'),
        formName: document.getElementById('form-entry-name'),
        formDescription: document.getElementById('form-entry-message'),
        formSubmit: document.getElementById('form-entry-submit'),
        formFile: document.getElementById('form-entry-file'),
    };
}