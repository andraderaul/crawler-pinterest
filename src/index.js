const puppeteer = require("puppeteer");
const fs = require("fs");
const fetch = require("node-fetch");

async function download(uri, filename, callback) {
  const res = await fetch(uri);
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filename);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function () {
      resolve();
      callback();
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto("https://br.pinterest.com/search/pins/?q=bom%20dia", {
    waitUntil: "networkidle0",
  });

  await page.screenshot({ path: "example.png" });

  const srcImgs = await page.$$eval("img", (imgs) =>
    imgs.map((img) => img.srcset)
  );

  srcImgs.forEach((srcImg, index) => {
    const src = srcImg.split(", ")[1].split(" ")[0];
    download(src, `images/img${index}.png`, function () {
      console.log("done");
    });
  });

  await browser.close();
})();
