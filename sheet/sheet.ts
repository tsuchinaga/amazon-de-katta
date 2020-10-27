function sheet() {
    let spreadsheet = SpreadsheetApp.getActive()
    let sheet = spreadsheet.getSheetByName("シート1")

    let threads = GmailApp.search("Amazon.co.jp ご注文の確認", 0, 1)
    let gmailMessages = GmailApp.getMessagesForThreads(threads)
    for (let messages of gmailMessages) {
        for (let message of messages) {
            let title = ""
            let url = ""
            let img = ""
            let price = 0
            let started = false
            for (let line of message.getBody().split("\n")) {
                if (line.match(/id="itemDetails"/)) started = true // 商品詳細を見つけたらスタート

                if (started) {
                    if (line.match(/title=".+"/)) {
                        url = line.match(/href="([^"]+)"/)[1]
                        title = line.match(/title="([^"]+)"/)[1]
                        img = line.match(/src="([^"]+)"/)[1]
                    }
                    if (line.match(/class="price"/)) price = parseInt(line.match(/<strong>￥ (\d+)<\/strong>/)[1])
                    if (line.match(/<\/table>/)) break // 始まっていてかつテーブルタグが閉じられたら終了
                }
            }

            if (url !== "" && title !== "") {
                let row = sheet.getLastRow() + 1

                url = url.match(/&U=(http[^&]+)/)[1]
                    .split("/ref")[0]
                    .replace(/%3A/g, ":")
                    .replace(/%2F/g, "/")

                let imgPaths = img.split("/")
                imgPaths[imgPaths.length - 1] = imgPaths[imgPaths.length - 1].split(".")[0]
                img = imgPaths.join("/") + ".jpg"

                sheet.getRange(row, 1).setValue(title)
                sheet.getRange(row, 2).setValue(url)
                sheet.getRange(row, 3).setValue(img)
                sheet.getRange(row, 4).setValue(price)
            }
        }
    }
}
