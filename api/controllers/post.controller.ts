const post = require('../models/post.model')
const user = require('../models/user.model');
import { initialValue, PostType } from "../../type/postType"
var cloudinary = require('cloudinary').v2;
var uploads = {};
cloudinary.config({
    cloud_name: 'ilike',
    api_key: '678772438397898',
    api_secret: 'zvdEWEfrF38a2dLOtVp-3BulMno'
});
const uploadImg = async (path:any) => {
    let res
    try {
        res = await cloudinary.uploader.upload(path)
    }
    catch(err) {
        console.log(err)
        return false
    }
    return res.secure_url
}

exports.createPost =async (req : any, res :any) => {
    let urlImg = null;
 let {userId, desc} = req.body;
    if(typeof req.file !== 'undefined' ) {
        urlImg = await uploadImg(req.file.path)
    }
    if(urlImg !== null) {
        if(urlImg === false) {
            res.status(500).json({msg: 'server error'});
            return;
        }
    }
   
    if(!userId || !desc || !urlImg){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    const newPost = new post({
        ...initialValue,
        userId : userId,
        desc : desc,
        img : urlImg
    })
    try {
        await newPost.save()
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : newPost })
}

exports.updatePost =async (req : any, res :any) => {
    let {userId, idPost, desc, img} = req.body;
    if(!idPost || !desc || !img){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    try{
        postFind = await post.findOne({'_id': idPost});
    }
    catch(err){
        res.json({msg: err});
        return;
    }
    if(postFind == null){
        res.status(422).json({msg: "Invalid data"});
        return;
    }
    if(postFind.userId !== userId) {
        res.status(401).json({msg: "Authentication information"});
        return; 
    }
    postFind.desc = desc
    postFind.img = img
    try {
        await postFind.save()
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.deletePost =async (req : any, res :any) => {
    let {idPost} = req.params;
    let {userId} = req.body;
    if(!idPost || !userId){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    try{
        postFind = await post.findOne({'_id': idPost});
    }
    catch(err){
        res.json({msg: err});
        return;
    }
    if(postFind == null){
        res.status(422).json({msg: "Invalid data"});
        return;
    }

    if(postFind.userId !== userId) {
        res.status(401).json({msg: "Authentication information"});
        return; 
    }

    try {
        await postFind.deleteOne()
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.likePost =async (req : any, res :any) => {
    let {idPost} = req.params;
    let {userId} = req.body;
    if(!idPost || !userId){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    try{
        postFind = await post.findOne({'_id': idPost});
    }
    catch(err){
        res.json({msg: err});
        return;
    }
    if(postFind == null){
        res.status(422).json({msg: "Invalid data"});
        return;
    }

    if(postFind.likes.includes(userId)){
        let newLikes = postFind.likes.filter((item : string) => item !== userId)
        postFind.likes = newLikes
    }else{
        postFind.likes.push(userId)
    }

    try {
        await postFind.save()
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.detailPost =async (req : any, res :any) => {
    let {idPost} = req.params;
    if(!idPost){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    try{
        postFind = await post.findOne({'_id': idPost});
    }
    catch(err){
        res.json({msg: err});
        return;
    }
    if(postFind == null){
        res.status(422).json({msg: "Invalid data"});
        return;
    }

    try {
        await postFind
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.listPostProfile =async (req : any, res :any) => {
    let {userId} = req.body;
    if(!userId){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = [];
    try{
        postFind = await post.find({'userId': userId});
    }
    catch(err){
        res.json({msg: err});
        return;
    }
    if(postFind == null){
        res.status(422).json({msg: "Invalid data"});
        return;
    }

    try {
        await postFind
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.newsFeed =async (req : any, res :any) => {
    try {
        const currentUser = await user.findById(req.params.userId);
        const userPosts = await post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
          currentUser.followings.map((friendId:any) => {
            return post.find({ userId: friendId });
          })
        );
        res.status(200).json(userPosts.concat(...friendPosts));
      } catch (err) {
        res.status(500).json(err);
      }
    
}