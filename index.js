const express = require('express')
const fs = require('fs')
const path = require('path');
const ejs = require('ejs')

const app = new express()

app.get("/*", function (req, res, next) {
    const last = req.path.charAt(req.path.length - 1);
    let curPath;
    if ('/' === last) {
        curPath = req.path
    } else {
        curPath = req.path + '/';
    }
    // 1. 假设是文件请求
    const filePath = path.join(__dirname, curPath);
    const exist = fs.existsSync(filePath);
    if (exist) {
        const fileName = req.path.split('/').pop();
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename=' + fileName,
                'Content-Length': stats.size
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    } else {
        res.sendStatus(404)
        return;
    }

    // 2. 不是文件，是目录
    let dirPath = path.join(__dirname, req.path);
    fs.readdir(dirPath, function (err, fileArr) {
        if (err) {
            console.error(err)
            res.send("error:")
            return;
        }
        let dirs = [];
        let files = [];
        fileArr.forEach(function (file) {
            const filePathTmp = path.join(dirPath, file);
            const stats = fs.statSync(filePathTmp);
            if (stats.isFile()) {
                files.push(file);
            } else {
                dirs.push(file);
            }
        });
        dirs.sort();
        files.sort();

        let arr = req.path.split('/');
        arr.pop();
        let prePath = arr.join('/');
        
        const first = prePath.charAt(0);
        if ('/' !== first) {
            prePath = "/" + prePath;
        }

        ejs.renderFile('files.ejs', { files: files, dirs: dirs, path: curPath, prePath: prePath }, function (err, str) {
            // console.log(str)
            res.send(str)
        });
    });
})

app.listen(80, function () {
    console.log("File server start successfully")
})
