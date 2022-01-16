const post = require('../models/post.model')
const user = require('../models/user.model');
import { Request, Response } from 'express';
import { initialValue, PostType } from "../../type/postType"
var cloudinary = require('cloudinary').v2;
var uploads = {};
cloudinary.config({
    cloud_name: 'ilike',
    api_key: '678772438397898',
    api_secret: 'zvdEWEfrF38a2dLOtVp-3BulMno'
});
const uploadImg = async (path:string) => {
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
    console.log(typeof req.file);
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
    let  userFind = await user.findById(userId);
    const newPost = new post({
        ...initialValue,
        name: userFind.name,
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
    let {userId, idPost, desc} = req.body;
    let urlImg = null;
    if(typeof req.file !== 'undefined' ) {
        urlImg = await uploadImg(req.file.path)
    }
    if(!idPost || !desc || !urlImg){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    try{
        postFind = await post.findById(idPost);
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
    postFind.img = urlImg
    try {
        await postFind.save()
    } catch (error) {
        res.status(500).json({ msg: error });
        return;
    }
    res.status(201).json({ msg: 'success', post : postFind })
}

exports.deletePost =async (req : Request, res :Response) => {
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

exports.likePost =async (req : Request, res :Response) => {
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

exports.detailPost =async (req : Request, res :Response) => {
    let {idPost} = req.params;
    if(!idPost){
        res.status(402).json({msg: "Invalid data"});
        return;
    }
    let postFind = null;
    let userPostDetail = null
    try{
        postFind = await post.findOne({'_id': idPost});
        let userFind = await user.findOne({'_id': postFind.userId})
        userPostDetail = {
            id: userFind._id,
            name: userFind.name,
            address: userFind.address,
            profilePicture: userFind.profilePicture,
        }
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
    res.status(201).json({post : postFind, userPost: userPostDetail })
}

exports.listPostProfile =async (req : Request, res :Response) => {
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

exports.newsFeed =async (req : Request, res :Response) => {
    let {userId} = req.params
    let page = parseInt(req.params.page, 10);
    let limit = parseInt(req.params.limit, 10);
    try {
        const currentUser = await user.findById(userId);
        const userPosts = await post.find({ 'userId': currentUser._id });
        const friendPosts = await Promise.all(
          currentUser.followings.map((friendId:string) => {
            return post.find({ 'userId': friendId });
          })
        );
        let newFeed = userPosts.concat(...friendPosts);
        newFeed.sort((a:any, b:any) =>{
            return b.createdAt - a.createdAt;
        })
        
        let skip = page * 10
        let top = skip + limit
        if (top > newFeed.length) {
         top = skip + (newFeed.length - skip);
        }
        let pagedNewFeed = newFeed.slice(skip, top);
        res.status(200).json(pagedNewFeed);
      } catch (err) {
        res.status(500).json(err);
      }
    
}

exports.mycomment = async (req : Request, res :Response) => {
    if (
      typeof req.body.userId === "undefined" ||
      typeof req.body.id_post === "undefined" ||
      typeof req.body.name === "undefined" ||
      typeof req.body.comment === "undefined"
    ) {
      res.status(422).json({ msg: "Invalid data" });
      return;
    }
  
    let { userId, id_post, name, comment,profilePicture } = req.body;
    
    let postFind;
    try {
        postFind = await post.findById(id_post);
    } catch (err) {
      res.status(422).json({ msg: " ID post Invalid data" });
      return;
    }
    const new_comment ={
      profilePicture:profilePicture,
      userId: userId,
      id_post: id_post,
      name: name,
      comment: comment
    };
    postFind.comments.push(new_comment);
   
    try {
        postFind.save();
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: err });
      return;
    }
    res.status(201).json({ msg: "success" });
    return;
  };
  
  exports.getCommentByIDPost = async (req : Request, res :Response) => {
    if (
      typeof req.body.id_post === "undefined"
    ) {
      res.status(422).json({ msg: "Invalid data" });
      return;
    }
    let { id_post } = req.body;
    let postFind = await post.findById(id_post);
    let commentList = postFind.comments
    res.status(200).json({ data: commentList });
  
  };
  