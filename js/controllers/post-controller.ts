import { ModelView } from "../model-view";
import { PublicPostService } from "../services/public-post-service";
import { ProfileService } from "../services/profile-service";
import { Profile } from "../dto/profile";
import { Post } from "../dto/post";
import { SchemaService } from "../services/util/schema-service";
import { QuillService } from "../services/util/quill-service";
import { Dom7, Template7 } from "framework7";
import { Global } from "../global";


var $$ = Dom7;

class PostController {

    _postTemplate: any
    loadedPost:Post


    private repliesService:PublicPostService

    constructor(
        private schemaService:SchemaService,
        private quillService:QuillService
    ) {
        this._compilePostTemplate()
    }


    initializeQuill(cid:string) {
        let selector = `#create-reply-textarea-${cid}`
        this.quillService.buildQuillPostEditor(selector)
      }
    

    async showPost(cid:string) : Promise<ModelView> {

        return new ModelView(async () => {

            this.loadedPost = await PublicPostService.read(cid)
            PublicPostService.translatePost(this.loadedPost)

            let repliesFeed = await this.schemaService.openFeed(this.loadedPost.replies, Global.orbitAccessControl)
            await repliesFeed.load(100)

            this.repliesService = new PublicPostService(repliesFeed, this.schemaService)

            let replies:Post[] = await this.repliesService.getPosts(repliesFeed, 100)


            //Show the edit button to the owner
            let currentUser:Profile = await ProfileService.getCurrentUser()
        
            let model = {
              post: this.loadedPost,
              replies: replies,
              showEditLink: (currentUser && currentUser._id.toString() == this.loadedPost.owner.toString()),
              profilePic: currentUser ? currentUser.profilePic : undefined
            }

            return model

        }, 'pages/post/show.html')

        

    }

    async postReply(e: Event): Promise<void> {

        let content = this.quillService.activeEditor.getContents()
        let length = this.quillService.activeEditor.getLength()
    
        // return if empty message. quill length is 1 if it's empty
        if (length == 1) return
    
        let post:Post = await this.repliesService.postMessage(content, window['currentAccount'])
    
        $$(`#replies-list-${this.loadedPost.cid}`).prepend(this._postTemplate(post))
    
    
        this.quillService.activeEditor.setText('')
        this.quillService.activeEditor.focus()
    
      }


      _compilePostTemplate() {

        this._postTemplate = Template7.compile(
          `
            <li>
              <a href="/post/show/{{cid}}" class="item-link">
                <div class="item-content" id="post_{{cid}}">
                  <div class="item-media">
                    {{#if ownerProfilePic}}
                      <img class="profile-pic-thumb" src="{{js "window.ipfsGateway"}}/{{ownerProfilePic}}">
                    {{else}}
                      <i class="f7-icons profile-pic-thumb">person</i>
                    {{/if}}
                  </div>
                  <div class="item-inner">
                    <div class="item-title-row">
                      <div class="item-title"><span class="post-owner-display">{{ownerDisplayName}}</span>
                        <div class="post-owner">{{owner}}</div>
                      </div>
                      <div class="item-after">
                        {{dateCreated}}
                      </div>
                    </div>
                    <div class="item-subtitle">{{contentTranslated}}</div>
                  </div>
                </div>
              </a>
            </li>
          `
        )
        
    
      }
    
    


}

export {
    PostController
}











// import { ModelView } from '../model-view'


// // import { Quill } from 'quill';
// import Quill = require('quill/dist/quill.js')

// import {PublicPostService} from "../services/public-post-service";
// import {ProfileService} from "../services/profile-service";
// import {QuillService} from "../services/quill-service";
// import {UploadService} from "../services/upload-service";

// import {Dom7, Template7} from "framework7";
// import {Global} from "../global";
// import {Post} from "../dto/post";
// import {PromiseView} from "../promise-view";
// import { QueueService } from '../services/queue_service';
// import { Profile } from '../dto/profile';
// var $$ = Dom7

// class PostController {

//     quill: any

//     constructor(
//       private queueService: QueueService,
//       private publicPostService:PublicPostService,
//       private profileService:ProfileService,
//       private quillService:QuillService,
//       private uploadService:UploadService) {
//         const self = this;


//         $$(document).on('submit', '#create-post-form', function(e) {
//           e.preventDefault()
//           self.postCreateSave(e)
//         });

//         $$(document).on('click', '.bold-button', function(e) {
//           e.preventDefault()
//           self.boldClick(e)
//         })

//         $$(document).on('click', '.italic-button', function(e) {
//           e.preventDefault()
//           self.italicClick(e)
//         })

//         $$(document).on('click', '.link-button', function(e) {
//           e.preventDefault()
//           self.linkClick(e)
//         })

//         $$(document).on('click', '.blockquote-button', function(e) {
//           e.preventDefault()
//           self.blockquoteClick(e)
//         })

//         $$(document).on('click', '.header-1-button', function(e) {
//           e.preventDefault()
//           self.header1Click(e)
//         })

//         $$(document).on('click', '.header-2-button', function(e) {
//           e.preventDefault()
//           self.header2Click(e)
//         })

//         $$(document).on('click', '.divider-button', function(e) {
//           e.preventDefault()
//           self.dividerClick(e)
//         })

//         $$(document).on('click', '.image-button', function(e) {
//           e.preventDefault()
//           self.imageClick(e)
//         })

//         $$(document).on('change', '.image-button-input', async function(e) {
//           e.preventDefault()
//           await self.imageSelected(this)
//         })

//         $$(document).on('click', '.video-button', function(e) {
//           e.preventDefault()
//           self.videoClick(e)
//         })

//         $$(document).on('change', '.video-button-input', async function(e) {
//           e.preventDefault()
//           await self.videoSelected(this)
//         })

//         $$(document).on('click', '.cover-photo-img', function(e) {
//           e.preventDefault()
//           self.selectCoverPhoto(e)
//         })
//     }

//     initializeQuill(selector) {
//       this.quill = this.quillService.buildQuillPostEditor(selector)
//     }

//     async showCreatePost() : Promise<ModelView> {
//       return new ModelView({},  'pages/post/create.html')
//     }

//     async showPost(id:string) : Promise<ModelView> {

//         let post = await this.publicPostService.read(id)

//         //Show the edit button to the owner
//         let currentUser;

//         try {
//           currentUser = await this.profileService.read(window['currentAccount'])
//         } catch(ex) {
//           console.log("Profile doesn't exist");
//         }

//         let model = {
//           post: post,
//           showEditLink: (currentUser && currentUser.id == post.owner)
//         }

//         return new ModelView(model, 'pages/post/show.html')

//     }

//     async showPostList() : Promise<ModelView> {

//         let posts = await this.publicPostService.getRecentPosts({limit: 10})

//         let model = {
//           posts: posts
//         }

//         return new ModelView(model, 'pages/post/list.html')

//     }

//     async showPostEdit(cid:string) : Promise<ModelView> {

//         let post = await this.publicPostService.read(cid)

//         let model = {
//           post: post
//         }

//         return new ModelView(model, 'pages/post/edit.html')

//     }

//     async postCreateSave(e): Promise<void> {

//       try {

//         //Get data
//         const postData: Post = await this._getPostData('#create-post-form')

//         let cid:string = await this.publicPostService.create(postData)

//         //Redirect to home page
//         Global.navigate('/post/show/' + cid)

//       } catch (ex) {
//         Global.showExceptionPopup(ex)
//       }

//     }

//     async _getPostData(formId: string) : Promise<Post> {

//       //Get data
//       let postData: Post = <Post> Global.app.form.convertToData(formId)

//       //Get date
//       // postData.dateCreated = new Date().toJSON().toString()

//       //Get author info
//       postData.owner = window['currentAccount']

//       //Add main photo

//       //Get story contents. Quill delta
//       postData.content = this.quill.getContents()


//       return postData
//     }


//     /***EDITOR ACTIONS**/
//     boldClick(e) {
//       const currentFormat = this.quill.getFormat()
//       this.quill.format('bold', !currentFormat.bold)
//     }

//     italicClick(e) {
//       const currentFormat = this.quill.getFormat()
//       this.quill.format('italic', !currentFormat.italic)
//     }

//     linkClick(e) {
//       let value = prompt('Enter link URL');
//       this.quill.format('link', value)
//     }

//     blockquoteClick(e) {
//       const currentFormat = this.quill.getFormat()
//       this.quill.format('blockquote', !currentFormat.blockquote);
//     }

//     header1Click(e) {
//       const currentFormat = this.quill.getFormat()
//       this.quill.format('header', currentFormat.header ? undefined : 1);
//     }

//     header2Click(e) {
//       const currentFormat = this.quill.getFormat()
//       this.quill.format('header', currentFormat.header ? undefined : 2);
//     }

//     dividerClick(e) {

//       let range = this.quill.getSelection(true)

//       this.quill.insertText(range.index, '\n', Quill.sources.USER)

//       this.quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER)

//       this.quill.setSelection(range.index + 2, Quill.sources.SILENT)

//     }

//     imageClick(e) {

//       const imageButtonInput = $$(".image-button-input");
//       imageButtonInput.click()

//     }

//     //TODO: move to service
//     async imageSelected(fileElement: Element): Promise<void> {

//       let imageCid = await this.uploadService.uploadFile(fileElement)


//       let range = this.quill.getSelection(true)

//       this.quill.insertText(range.index, '\n', Quill.sources.USER)

//       this.quill.insertEmbed(range.index, 'ipfsimage', {ipfsCid: imageCid} , Quill.sources.USER)

//       this.quill.setSelection(range.index + 2, Quill.sources.SILENT)

//       //Make it the cover photo
//       $$('input[name="coverPhoto"]').val(imageCid)

//       this.loadCoverPhotos()

//     }


//     //TODO: load this from a template7 template somehow instead
//     loadCoverPhotos() : void {

//       const images = this.publicPostService.getImagesFromPostContentOps(this.quill.getContents().ops)

//       $$('.cover-photo-img-wrapper').empty()
//       $$('.cover-photo-preview').hide()


//       if (images.length > 0) {
//         $$('.cover-photo-preview').show()
//       }


//       for (let imageCid of images) {

//         const imgElement = $$('<img>')
//         imgElement.attr("src", Template7.global.ipfsGateway + '/' + imageCid)
//         imgElement.data("image-cid", imageCid)
//         imgElement.addClass("cover-photo-img")

//         $$('.cover-photo-img-wrapper').append(imgElement)

//       }

//       this.setCoverPhoto($$('input[name="coverPhoto"]').val())

//     }

//     selectCoverPhoto(e) : void {
//       this.setCoverPhoto($$(e.target).data("image-cid"))
//     }

//     //TODO: can definitely be nicer.
//     setCoverPhoto(imageCid: string) : void {

//       $$('input[name="coverPhoto"]').val(imageCid)

//       $$('.cover-photo-img-wrapper img').removeClass('selected')

//       $$('.cover-photo-img-wrapper img').each(function(index, item) {
//         if ($$(item).data("image-cid") == imageCid) {
//           $$(item).addClass('selected')
//         }
//       })

//     }


//     videoClick(e: Event) : void {
//       const videoButtonInput = $$(".video-button-input");
//       videoButtonInput.click()
//     }


//     //TODO: move to service
//     async videoSelected(fileElement: Element) {

//       let videoCid = await this.uploadService.uploadFile(fileElement)

//       let range = this.quill.getSelection(true)


//       this.quill.insertText(range.index, '\n', Quill.sources.USER)


//       this.quill.insertEmbed(range.index, 'ipfsvideo', {ipfsCid: videoCid} , Quill.sources.USER)


//       this.quill.setSelection(range.index + 2, Quill.sources.SILENT)

//     }




// }


// export {  PostController }
