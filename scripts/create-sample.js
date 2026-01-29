import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 獲取命令行參數
const componentName = process.argv[2];
if (!componentName) {
    console.error('錯誤：請提供組件名稱作為參數');
    console.log('使用方法：npm run create:component <組件名稱>');
    console.log('範例：npm run create:component User');
    process.exit(1);
}

const pageName = `${componentName}Page`;
const routePath = `/${componentName.toLowerCase()}`;

console.log('參數資訊：');
console.log(`- 組件名稱：${componentName}`);
console.log(`- 頁面名稱：${pageName}`);
console.log(`- 路由路徑：${routePath}`);

// 定義檔案路徑
const paths = {
    page: path.join(__dirname, `../src/views/${pageName}.vue`),
    component: path.join(__dirname, `../src/components/${componentName}.vue`),
    router: path.join(__dirname, '../src/router/index.js')
};

console.log('\n檔案路徑：');
console.log(`- 頁面檔案：${paths.page}`);
console.log(`- 組件檔案：${paths.component}`);
console.log(`- 路由檔案：${paths.router}`);

// 生成檔案內容
const generateFileContent = {
    page: (name) => `<script setup>
import ${name} from '@/components/${name}.vue';
</script>

<template>
    <div class="page page-${name.toLowerCase()}">
        <${name} />
    </div>
</template>`,
    
    component: (name) => `<template>
    <div class="${name.toLowerCase()}-component">
        <h2>${name} Component</h2>
        <p>這是一個 ${name} 組件</p>
    </div>
</template>

<script setup>
// ${name} 組件邏輯
</script>

<style lang="scss" scoped>
.${name.toLowerCase()}-component {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-top: 20px;
}
</style>`
};

// 確保目錄存在
const ensureDirectoryExists = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        console.log(`創建目錄：${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 更新路由配置
const updateRouter = () => {
    try {
        console.log('\n開始更新路由配置...');
        const routerContent = fs.readFileSync(paths.router, 'utf8');
        
        // 檢查是否已經存在頁面的導入
        if (!routerContent.includes(`import ${pageName}`)) {
            console.log('添加頁面導入...');
            const newImport = `import ${pageName} from '../views/${pageName}.vue'`;
            const updatedContent = routerContent.replace(
                /import.*HomePage.*$/m,
                `$&\n${newImport}`
            );
            
            // 檢查是否已經存在路由
            if (!routerContent.includes(`path: '${routePath}'`)) {
                console.log('添加路由配置...');
                const newRoute = `{
            path: '${routePath}',
            name: '${componentName.toLowerCase()}',
            component: ${pageName}
        }`;
                const finalContent = updatedContent.replace(
                    /routes: \[([\s\S]*?)\]/,
                    `routes: [$1,${newRoute}\n    ]`
                );
                fs.writeFileSync(paths.router, finalContent);
                console.log('路由配置更新完成');
            } else {
                console.log('路由已存在，跳過更新');
            }
        } else {
            console.log('頁面導入已存在，跳過更新');
        }
    } catch (error) {
        console.error('更新路由配置時發生錯誤:', error);
        throw error;
    }
};

// 主函數
const main = () => {
    try {
        console.log(`\n開始創建 ${componentName} 相關檔案...`);
        
        // 創建頁面檔案
        console.log(`\n創建頁面檔案：${paths.page}`);
        ensureDirectoryExists(paths.page);
        fs.writeFileSync(paths.page, generateFileContent.page(componentName));
        console.log('頁面檔案創建完成');
        
        // 創建組件檔案
        console.log(`\n創建組件檔案：${paths.component}`);
        ensureDirectoryExists(paths.component);
        fs.writeFileSync(paths.component, generateFileContent.component(componentName));
        console.log('組件檔案創建完成');
        
        // 更新路由配置
        updateRouter();
        
        console.log('\n所有檔案創建完成！');
        console.log(`您可以通過訪問 ${routePath} 來查看新創建的頁面`);
    } catch (error) {
        console.error('\n創建過程中發生錯誤:', error);
        process.exit(1);
    }
};

main(); 