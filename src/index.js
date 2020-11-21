const puppeteer = require("puppeteer");
const fs = require("fs");
const fetch = require("node-fetch");

const IMAGE_DIRECTORY = "images";

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

function createDirectory(name) {
  const dir = `${IMAGE_DIRECTORY}/${name}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function getExtension(uri) {
  const parts = uri.split(".");
  return parts[parts.length - 1];
}

async function downloadImages(uriImgs, imageName) {
  console.log(uriImgs.length);

  createDirectory(imageName);
  uriImgs.forEach(async (uri, index) => {
    const extension = getExtension(uri);
    const path = `${IMAGE_DIRECTORY}/${imageName}/${imageName}${index}.${extension}`;

    await download(uri, path, function () {
      console.log("done");
    });
  });
}

async function getImages(page, uri) {
  await page.goto(uri, {
    waitUntil: "networkidle0",
  });

  await page.screenshot({ path: "example.png" });

  const uriImgs = await page.$$eval("img", (imgs) =>
    imgs
      .filter((img) => img.srcset !== "")
      .map((img) => img.srcset.split(", ")[1].split(" ")[0])
  );

  return uriImgs;
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    const uriImgs = await getImages(
      page,
      "https://br.pinterest.com/search/pins/?q=bom%20dia%20whatsapp"
    );

    await downloadImages(uriImgs, "bom_dia");
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
  }
})();
