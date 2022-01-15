export {};
const post_controller = require('../controllers/post.controller');
const multer = require('multer')
const storage = multer.diskStorage({
    destination: './files',
    filename(req:any, file:any, cb:any) {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
  });
  const upload = multer({ storage });

module.exports = (app : any) => {
    app.route('/post/create')
    .post(upload.single('file'),post_controller.createPost);

    app.route('/post/update')
    .post(upload.single('file'),post_controller.updatePost);
    
    app.route('/post/delete/:idPost')
    .post(post_controller.deletePost);
    
    app.route('/post/like/:idPost')
    .post(post_controller.likePost);
    
    app.route('/post/:idPost')
    .get(post_controller.detailPost);
    
    app.route('/profile/:name')
    .get(post_controller.listPostProfile);

    app.route('/newsFeed/:userId/:page/:limit')
    .get(post_controller.newsFeed)

    app.route('/comment')
    .post(post_controller.mycomment);
    
    app.route('/comment/post')
    .post(post_controller.getCommentByIDPost)
}