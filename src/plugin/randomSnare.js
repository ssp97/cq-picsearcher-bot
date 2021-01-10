import CQ from '../CQcode';
import path from "path";
import fs from "fs";
import stringify from 'qs/lib/stringify';
import request from "request"


const dir = path.resolve('./');
const randomSnareDir = path.join(dir, "data", "randomSnare")


function hasImage(msg) {
    return msg.indexOf('[CQ:image') !== -1;
}

function getImgs(msg) {
    const reg = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g;
    const result = [];
    let search = reg.exec(msg);
    while (search) {
        result.push({
            file: CQ.unescape(search[1]),
            url: CQ.unescape(search[2]),
        });
        search = reg.exec(msg);
    }
    return result;
}

function downloadFile(uri, filename, callback) {
    var stream = fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close', callback);
}

export default ctx => {
    const rules = global.config.bot.randomSnare;

    if ([rules.add, rules.get, rules.noImage, rules.existImage].some(v => !(typeof v === 'string' && v.length))) return false;
    const addReg = new RegExp(rules.add);
    const getReg = new RegExp(rules.get);
    const addExec = addReg.exec(ctx.message);
    const getExec = getReg.exec(ctx.message);

    if (!fs.existsSync(randomSnareDir)){
        fs.mkdirSync(randomSnareDir)
    }

    if (addExec) {
        if (hasImage(ctx.message)) {
            const imgData = getImgs(ctx.message)[0]
            console.log(imgData.file)
            const imgFileName = imgData.file.replace("image", "jpg")
            const imgFilePath = path.join(randomSnareDir, imgFileName)
            if (fs.existsSync(imgFilePath)) {
                global.replyMsg(ctx, rules.existImage);
            } else {
                downloadFile(imgData.url, imgFilePath, () => {
                    const filesList = fs.readdirSync(randomSnareDir);
                    global.replyMsg(ctx, "加图完成，图片总量{}".replace("{}", filesList.length))
                })
            }
        } else {
            global.replyMsg(ctx, rules.noImage);
        }
        return true;
    }
    if (getExec) {

        const filesList = fs.readdirSync(randomSnareDir);
        const img = filesList[Math.round(Math.random() * filesList.length)]
        const imgPath = path.join(randomSnareDir, img)
        global.replyMsg(ctx, "[CQ:image,file=file://{}]".replace("{}", imgPath));
        return true;
    }
    if (ctx.message === "--rs_info") {

        global.replyMsg(ctx, randomSnareDir);
    }

    return false;
};
