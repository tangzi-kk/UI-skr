#!/usr/bin/env node
/**
 * 年度看板 · 离线自动化编译、静态体检与端到端热分发脚本
 * Matt Pocock 高确定性工程化闭环专享
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const APP_WEB_DIR = '/Applications/年度看板.app/Contents/Resources/web';
const BABEL_PATH = path.join(ROOT_DIR, 'lib', 'babel.min.js');

if (!fs.existsSync(BABEL_PATH)) {
  console.error('[Error] 未找到本地 Babel 编译器:', BABEL_PATH);
  process.exit(1);
}

const babel = require(BABEL_PATH);

console.log('==============================================');
console.log('🚀 年度看板 · 开始工程化编译与热分发流水线');
console.log('==============================================');

// 1. 编译各 JSX 文件
const filesToCompile = ['app', 'dialog', 'tweaks-panel'];
for (const base of filesToCompile) {
  const jsxFile = path.join(ROOT_DIR, `${base}.jsx`);
  const jsFile = path.join(ROOT_DIR, `${base}.js`);
  if (!fs.existsSync(jsxFile)) continue;

  const t0 = Date.now();
  const jsxCode = fs.readFileSync(jsxFile, 'utf8');
  try {
    const res = babel.transform(jsxCode, { presets: ['react'] }).code;
    fs.writeFileSync(jsFile, res, 'utf8');
    console.log(`✓ [Babel 转译] ${base}.jsx -> ${base}.js (${res.length} bytes, 用时 ${Date.now() - t0}ms)`);
  } catch (err) {
    console.error(`✗ [编译失败] ${base}.jsx:`, err.message);
    process.exit(1);
  }
}

// 2. 静态 AST 零未定义变量体检 (app.jsx)
console.log('\n🔍 [AST 静态体检] 正在分析未声明变量...');
const appCode = fs.readFileSync(path.join(ROOT_DIR, 'app.jsx'), 'utf8');
const undeclared = new Set();
const globals = new Set([
  'window', 'document', 'localStorage', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'fetch', 'console', 'Math', 'Date', 'JSON',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'Set', 'Map', 'Promise',
  'React', 'ReactDOM', 'solarlunar', 'navigator', 'location', 'URL', 'URLSearchParams', 'performance',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'TouchEvent', 'WheelEvent', 'PointerEvent',
  'Node', 'Element', 'HTMLElement', 'AbortController', 'FormData', 'Blob', 'FileReader',
  'alert', 'confirm', 'prompt', 'btoa', 'atob', 'getComputedStyle', 'useTweaks',
  'TweaksPanel', 'TweakSection', 'TweakRadio', 'TweakSelect', 'TweakToggle'
]);

const checkPlugin = function() {
  return {
    visitor: {
      ReferencedIdentifier(pathNode) {
        const name = pathNode.node.name;
        if (globals.has(name)) return;
        if (!pathNode.scope.hasBinding(name)) {
          undeclared.add(name);
        }
      }
    }
  };
};

try {
  babel.transform(appCode, { presets: ['react'], plugins: [checkPlugin] });
  if (undeclared.size === 0) {
    console.log('✓ [AST 静态体检通过] 0 未声明变量，无隐性运行时雷区！');
  } else {
    console.warn('⚠️ [警告] 发现未声明标识符:', Array.from(undeclared));
  }
} catch (err) {
  console.warn('⚠️ [AST 扫描跳过]:', err.message);
}

// 3. Node 语法完整性校验
try {
  execSync(`node --check "${path.join(ROOT_DIR, 'app.js')}"`, { stdio: 'pipe' });
  console.log('✓ [语法校验通过] app.js Node AST 语法校验成功！');
} catch (err) {
  console.error('✗ [语法错误] app.js 语法校验失败！');
  process.exit(1);
}

// 4. 自动分发至 /Applications/年度看板.app (保证桌面端与开发端 100% 实时一致)
if (fs.existsSync(APP_WEB_DIR)) {
  console.log('\n🚀 [分发更新] 正在同步最新代码与纯净数据到 /Applications/年度看板.app ...');
  const syncFiles = [
    'app.jsx', 'app.js', 'dialog.jsx', 'dialog.js',
    'tweaks-panel.jsx', 'tweaks-panel.js', 'styles.css',
    'index.html', 'sync.js', 'menubar.html', 'serve.js',
    'download.html', 'schedule.html', 'mobile-app.html', 'architecture.html',
    'POLARIS-AI-DESIGN-GUIDE.md',
    'mobile-style.css', 'component-library.js', 'polaris-store.js',
    'year-calendar-k80.apk',
    path.join('assets', 'board_data.js'),
    path.join('assets', 'base-upsert.js'),
    path.join('assets', 'sfx.js'),
    path.join('assets', 'app-icon.svg'),
  ];
  let updatedCount = 0;
  for (const f of syncFiles) {
    const src = path.join(ROOT_DIR, f);
    const dest = path.join(APP_WEB_DIR, f);
    if (fs.existsSync(src)) {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      updatedCount++;
    }
  }
  console.log(`✓ [分发完成] 已成功更新应用包内 ${updatedCount} 个核心文件（含纯净版 board_data.js）！`);
}

// 5. 独立安装包制作 (可选: --dmg)
const makeDmg = process.argv.includes('--dmg');
if (makeDmg) {
  console.log('\n📦 [DMG 打包] 正在生成独立安装包至桌面...');
  const tmpPackDir = path.join(os.tmpdir(), `board_dmg_pack_${Date.now()}`);
  const destDmg = path.join(os.homedir(), 'Desktop', '年度看板.dmg');
  try {
    fs.mkdirSync(tmpPackDir, { recursive: true });
    const targetApp = path.join(tmpPackDir, '年度看板.app');
    
    // 以现有应用包为母体制作离线安装包
    if (fs.existsSync(APP_WEB_DIR)) {
      execSync(`cp -R "/Applications/年度看板.app" "${targetApp}"`);
      // 软链接 Applications 方便用户拖拽安装
      execSync(`ln -s /Applications "${path.join(tmpPackDir, 'Applications')}"`);
      // 重签名
      try {
        execSync(`codesign --force --deep -s - "${targetApp}"`, { stdio: 'ignore' });
      } catch (e) {}
      // 打包 DMG
      execSync(`hdiutil create -volname "年度看板" -srcfolder "${tmpPackDir}" -ov -format UDZO "${destDmg}"`, { stdio: 'ignore' });
      console.log(`✓ [DMG 生成成功] 安装包已保存至: ${destDmg}`);
    } else {
      console.warn('⚠️ [提示] 未找到 /Applications/年度看板.app 母体，跳过 DMG 镜像打包');
    }
  } catch (err) {
    console.error('✗ [DMG 打包失败]:', err.message);
  } finally {
    try { execSync(`rm -rf "${tmpPackDir}"`); } catch (e) {}
  }
}

console.log('==============================================');
console.log('🎉 流水线完成！');
console.log('==============================================\n');
