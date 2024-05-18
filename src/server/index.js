const http = require("http")
const path = require("path")
const fse = require("fs-extra")
const multiparty = require("multiparty")


const server = http.createServer()
//大文件存储目录 
const UPLOAD_DIR = path.resolve(__dirname, '..', "target")

const resolvePost = req =>
    new Promise(resolve => {
        let chunk = ""
        req.on("data", data => {
            chunk += data
        })
        req.on("end", () => {
            resolve(JSON.parse(chunk))
        })
    })

//写入文件流
const pipeStream = (path, writeStream) =>
    new Promise(reslove => {
        const readStream = fse.createReadStream(path)
        readStream.on("end", () => {
            fse.unlinkSync(path)
            reslove()
        })
        readStream.pipe(writeStream)
    })
//合并切片
const mergeChunk = async (filePath, filename, size) => {
    const chunkDir = path.resolve(UPLOAD_DIR, 'chunkDir' + filename)
    const chunkPaths = await fse.readdir(chunkDir)
    //根据切片下标进行排序
    //否则直接读取，顺序会错乱
    chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1])
    //并发写入文件
    await Promise.all(
        chunkPaths.map((chunkPath, index) => {
            pipeStream(
                path.resolve(chunkDir, chunkPath),
                //创建可写流
                fse.createWriteStream(filePath, {
                    start: index * size
                })
            )
        })
    )
    //合并后删除保存切片的目录
    fse.rmdirSync(chunkDir)
}

server.on("request", async (req, res) => {
    //解决跨域
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    //解决预请求
    if (req.method === 'OPTIONS') {
        res.staus = 200
        res.end()
        return
    }
    if (req.url === '/') {
        const multipart = new multiparty.Form()
        multipart.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                return
            }
            const [chunk] = files.chunk
            const [hash] = fields.hash
            const [filename] = fields.filename

            console.log("fields", fields)
            console.log("files", files)
            console.log("chunk", chunk)
            console.log('hash', hash)
            console.log("filename", filename)
            //创建临时文件夹用于临时存储chunk
            const chunkDir = path.resolve(UPLOAD_DIR, 'chunkDir' + filename)

            if (!fse.existsSync(chunkDir)) {
                await fse.mkdirs(chunkDir)
            }
            console.log("移动之前")
            await fse.move(chunk.path, `${chunkDir}/${hash}`)
            res.end("received file chunk")
            console.log("移动之后")
        })

    }
    if (req.url === '/merge') {
        console.log("正在merge")
        const data = await resolvePost(req)
        const { filename, size } = data
        const filePath = path.resolve(UPLOAD_DIR, `${filename}`)
        await mergeChunk(filePath, filename, size)
        res.end(
            JSON.stringify({
                code: 0,
                message: 'file merged success'
            })
        )
    }



})

server.listen(3000, () => {
    console.log("正在监听3000端口")
})