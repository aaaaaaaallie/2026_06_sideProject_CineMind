import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tinify from 'tinify';
import { glob } from 'glob';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 檢查 API key
if (!process.env.TINIFY_API_KEY) {
    console.error('錯誤：請在 .env 檔案中設置 TINIFY_API_KEY');
    process.exit(1);
}

// 設置 API key
tinify.key = process.env.TINIFY_API_KEY;

// 獲取當前檔案的路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定義圖片目錄（改為 dist 目錄）
const imageDir = path.join(__dirname, '../dist/assets');

// 獲取所有圖片檔案
const getImageFiles = async () => {
    const files = await glob('**/*.{jpg,jpeg,png}', { cwd: imageDir });
    return files;
};

// 壓縮圖片
const compressImage = async (file) => {
    const sourcePath = path.join(imageDir, file);
    const source = tinify.fromFile(sourcePath);
    await source.toFile(sourcePath);
    console.log(`已壓縮: ${file}`);
};

// 主函數
const main = async () => {
    try {
        console.log('開始壓縮圖片...');
        const files = await getImageFiles();
        console.log(`找到 ${files.length} 個圖片檔案`);

        for (const file of files) {
            await compressImage(file);
        }

        console.log('所有圖片壓縮完成！');
    } catch (error) {
        console.error('壓縮過程中發生錯誤:', error);
        process.exit(1);
    }
};

main(); 