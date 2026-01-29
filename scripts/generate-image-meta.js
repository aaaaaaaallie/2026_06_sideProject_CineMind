// scripts/generate-image-meta.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sizeOf from "image-size";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDirArg = process.argv[2];
if (!inputDirArg) {
  console.error(
    "❌ 請提供圖片資料夾路徑，例如：npm run gen-img-meta ./src/assets/images"
  );
  process.exit(1);
}

const imageDir = path.resolve(process.cwd(), inputDirArg);
const outputJson = path.join(imageDir, "image-data.json");

const supportedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const result = [];

function getAllImageFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      getAllImageFiles(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (supportedExtensions.includes(ext)) {
        try {
          const buffer = fs.readFileSync(fullPath);
          const dimensions = sizeOf(buffer);

          result.push({
            n: path.basename(entry.name, ext),
            top: 0,
            left: 0,
            width: dimensions.width,
            height: dimensions.height,
          });
        } catch (err) {
          console.warn(`⚠️ 無法處理圖片 ${fullPath}: ${err.message}`);
        }
      }
    }
  }
}

getAllImageFiles(imageDir);
fs.writeFileSync(outputJson, JSON.stringify(result, null, 2));
console.log("✅ JSON 生成成功！共處理圖片數：", result.length);
