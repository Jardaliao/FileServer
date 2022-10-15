const express = require('express')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const cors = require('cors')
const util = require('./util')

const app = new express()

app.use(cors())

/**
 * 设置映射路径
 * Windos：C:\\Windows\\user\\somebody\\Downloads
 */
let location = "D:\\Downloads"
if (!location) location = __dirname

const PORT = 80

app.get("/*", function (req, res, next) {
    const last = req.path.charAt(req.path.length - 1)
    let curPath
    if ('/' === last) {
        curPath = req.path
    } else {
        curPath = req.path + '/'
    }
    // 1. 假设是文件请求
    const filePath = path.join(location, curPath)
    const exist = fs.existsSync(filePath)
    if (exist) {
        const fileName = req.path.split('/').pop()
        const stats = fs.statSync(filePath)
        if (stats.isFile()) {
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename=' + fileName,
                'Content-Length': stats.size
            })
            fs.createReadStream(filePath).pipe(res)
            return
        }
    } else {
        res.sendStatus(404)
        return
    }

    // 2. 不是文件，是目录
    let dirPath = path.join(location, req.path)
    fs.readdir(dirPath, function (err, fileArr) {
        if (err) {
            console.error(err)
            res.send("error:")
            return
        }
        let dirs = []
        let files = []
        fileArr.forEach(function (file) {
            const filePathTmp = path.join(dirPath, file)
            const stats = fs.statSync(filePathTmp)
            if (stats.isFile()) {
                files.push(file)
            } else {
                dirs.push(file)
            }
        })
        dirs.sort()
        files.sort()

        let arr = req.path.split('/')
        arr.pop()
        let prePath = arr.join('/')

        const first = prePath.charAt(0)
        if ('/' !== first) {
            prePath = "/" + prePath
        }

        ejs.renderFile('files.ejs', { files: files, dirs: dirs, path: curPath, prePath: prePath, PORT: PORT }, function (err, str) {
            res.send(str)
        })
    })
})

app.post("/*", function (req, res, next) {
    // 当前目录
    const directory = path.join(location, req.path)
    // 手动解析文件，保存到磁盘
    // 获取body分隔符
    const separator = `--${req.headers['content-type'].split('boundary=')[1]}`
    let data = Buffer.alloc(0)
    // req 是一个可读流
    req.on('data', (chunk) => {
        data = Buffer.concat([data, chunk])
    })
    req.on('end', () => {
        util.parseFile(data, separator, directory)
    })

    setTimeout(() => { res.send("ok") }, 1000)
})

app.listen(PORT, function () {
    console.log("File server start successfully")
})
