const path = require('path')
const fs = require('fs')

/**
 * 将请求体的文件解析到目的目录下
 * @param {Buffer} data 请求体数据，在缓冲区里 
 * @param {String} separator multipart/form-data模式下请求体的分隔符
 * @param {String} directory 目的目录
 */
function parseFile(data, separator, directory) {
    // 1. 分割请求体 去掉前面的一个空格和后面的--结束符
    const bufArr = split(data, separator).slice(1, -1)
    bufArr.forEach(item => {
        // 2. 分割 head 与 body
        const [head, body] = split(item, '\r\n\r\n')
        const headArr = split(head, '\r\n').slice(1)
        // 3. 解析filename
        // head 的第一行肯定是 Content-Disposition
        const headerVal = parseHeader(headArr[0].toString())
        // 如果 head 内存在 filename 字段，则代表是一个文件
        if (headerVal.filename) {
            // 去掉文件名两边引号
            let name = headerVal.filename;
            name = /^["]?(.+?)["]?$/.exec(name)[1];
            const completePath = path.join(directory, name)
            // 4. 写入文件到磁盘
            fs.writeFileSync(completePath, body.slice(0, -2))
        }
    })
}

function parseHeader(header) {
    const [name, value] = header.split(': ')
    const valueObj = {}
    value.split(' ').forEach(item => {
        const [key, val = ''] = item.split('=')
        valueObj[key] = val 
    })
    return valueObj
}

function split(buffer, separator) {
    const res = []
    let offset = 0
    let index = buffer.indexOf(separator, 0)
    while (index != -1) {
        res.push(buffer.slice(offset, index))
        offset = index + separator.length
        index = buffer.indexOf(separator, index + separator.length)
    }
    res.push(buffer.slice(offset))
    return res
}

module.exports = { parseFile: parseFile }