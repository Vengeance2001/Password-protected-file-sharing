require("dotenv").config();
const express = require('express');
const app = express();
const multer = require('multer'); // handle file upload
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const File = require("./models/file")

app.use(express.urlencoded({extended: true})) // allows express to use forms eg: for password.

const upload = multer({dest: "upload"});  // all files should go inside the folder called upload.
mongoose.connect(process.env.DATABASEURL)

app.set("view engine", "ejs");
app.get("/", (req, res)=>{
    res.render("index");
})

app.post("/upload", upload.single("file"), async (req, res)=>{
    // res.send("hi");
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }
    if(req.body.password != null && req.body.password != ""){
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }

    const file = await File.create(fileData);
    res.render("index", {fileLink:`${ req.headers.origin}/file/${file._id}`}) // creates url
})

app.get("/file/:id", handledownload);
app.post("/file/:id", handledownload);

async function handledownload(req, res){
    const file = await File.findById(req.params.id)
    
    if(file.password != null){
        if(req.body.password == null){
            res.render("password")  // redirecting to password page
            return
        }
        if(!await bcrypt.compare(req.body.password, file.password)){
            res.render("password", {error: true})
            return
        } // check if the encrypted and entered pass match
    }
    file.downloadcount++
    await file.save()
    res.download(file.path, file.originalName)
}

app.listen(3000);