import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// 取得目前資料夾（ESM 沒有 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚙️ 可調參數
const config = {
  imageDir: path.join(__dirname, "sprite-generator"),
  outputImage: "./scripts/sprite-generator/sprite.png",
  outputCss: "./scripts/sprite-generator/sprite.css",
  spacing: 8,
  layout: "horizontal", // "horizontal" or "vertical"
  cssClassPrefix: "image",
};

try {
  const currentDir = __dirname;
  const parentDir = path.dirname(currentDir);
  await fs.unlink(path.join(parentDir, config.outputImage)).catch(() => {});
  await fs.unlink(path.join(parentDir, config.outputCss)).catch(() => {});

  const fileList = await fs.readdir(config.imageDir);
  const imageFiles = fileList
    .filter((file) => /\.(png|jpe?g)$/i.test(file))
    .map((file) => path.join(config.imageDir, file));

  if (imageFiles.length === 0) {
    console.log("⚠️ 沒有找到圖片");
    process.exit(0);
  }

  const images = await Promise.all(
    imageFiles.map(async (file) => {
      const image = sharp(file);
      const meta = await image.metadata();
      const buffer = await image.toBuffer();
      return {
        name: path.parse(file).name,
        buffer,
        width: meta.width,
        height: meta.height,
      };
    })
  );

  let totalWidth = 0;
  let totalHeight = 0;
  let offsetX = 0;
  let offsetY = 0;
  let composite = [];
  let cssOutput = "";

  for (const img of images) {
    const name = img.name;
    const className = `.${config.cssClassPrefix}-${name}`;
    let top = 0,
      left = 0;

    if (config.layout === "horizontal") {
      left = offsetX;
      totalHeight = Math.max(totalHeight, img.height);
      offsetX += img.width + config.spacing;
      totalWidth = offsetX - config.spacing;
    } else {
      top = offsetY;
      totalWidth = Math.max(totalWidth, img.width);
      offsetY += img.height + config.spacing;
      totalHeight = offsetY - config.spacing;
    }

    composite.push({
      input: img.buffer,
      top,
      left,
    });

    cssOutput +=
      `${className} {\n` +
      `  width: vw(${img.width});\n` +
      `  height: vw(${img.height});\n` +
      `  background-image: url('${config.outputImage}');\n` +
      `  background-position: vw(-${left}) vw(-${top});\n` +
      `}\n\n`;
  }

  await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composite)
    .png()
    .toFile(config.outputImage);

  await fs.writeFile(config.outputCss, cssOutput);
  console.log("✅ Sprite 圖與 CSS 產出完成！");
} catch (err) {
  console.error("❌ 發生錯誤：", err);
}
