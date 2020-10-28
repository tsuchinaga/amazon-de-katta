function main() {
    let term = (Math.floor((new Date()).getTime() / 1000) - (10 * 60)).toString() // 10分前
    let query = "after:" + term + " Amazon.co.jp ご注文の確認"
    let threads = GmailApp.search(query, 0, 100)
    let gmailMessages = GmailApp.getMessagesForThreads(threads)
    let embeds = []
    for (let messages of gmailMessages) {
        for (let message of messages) {
            let title = ""
            let url = ""
            let img = ""
            let price = 0
            let started = false
            for (let line of message.getBody().split("\n")) {
                if (started && line.match(/<\/table>/)) break // 始まっていてかつテーブルタグが閉じられたら終了
                if (line.match(/id="itemDetails"/)) started = true // 商品詳細を見つけたらスタート

                if (started) {
                    if (url === "") url = getURL(line)
                    if (title === "") title = getTitle(line)
                    if (img === "") img = getIMG(line)
                    if (price === 0.0) price = getPrice(line)
                }
            }

            if (url !== "" && title !== "") {
                embeds.push({
                    "title": title,
                    "description": "￥ " + price.toString(),
                    "url": url,
                    "image": {"url": img}
                })
            }
        }
    }

    if (embeds.length > 0) {
        post(embeds)
    }
}

function getTitle(line: string): string {
    let match = line.match(/title="([^"]+)"/)
    if (match === null || match.length <= 1) return ""
    return match[1]
}

function getURL(line: string): string {
    let match = line.match(/href="([^"]+)"/);
    if (match === null || match.length <= 1) return ""
    let url = match[1]

    // 不要な文字列やパラメータを切って必要最低限の情報でamazon商品ページのURLを作る
    let uParam = url.match(/&U=(http[^&]+)/);
    if (uParam === null || uParam.length <= 1) return url

    return uParam[1]
        .replace(/%3A/g, ":")
        .replace(/%2F/g, "/")
        .split("/ref")[0]
}

function getIMG(line: string): string {
    let match = line.match(/src="([^"]+)"/)
    if (match === null || match.length <= 1) return ""
    let img = match[1]

    // 画像のサイズを通常サイズのものにする
    let imgPaths = img.split("/")
    imgPaths[imgPaths.length - 1] = imgPaths[imgPaths.length - 1].split(".")[0]
    return imgPaths.join("/") + ".jpg"
}

function getPrice(line: string): number {
    let match = line.match(/<strong>￥ (\d+)<\/strong>/)
    if (match === null || match.length <= 1) return 0
    return parseInt(match[1])
}

function post(embeds: object) {
    let url = PropertiesService.getScriptProperties().getProperty("DISCORD_WEBHOOK")
    if (url === null) {
        Logger.log("DISCORD_WEBHOOKが設定されていません")
        return
    }
    UrlFetchApp.fetch(url, {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify({"embeds": embeds})
    })
}
