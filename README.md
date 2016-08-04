# McLauncherNode

McLauncher For Node.js
基于Node.js开发的Minecraft启动器核心

# How to Use
```javascript
const MinecraftLauncher = require('./dist/launcher');

// 实例化一个启动器配置，并指定游戏版本为1.8
var launcher = new MinecraftLauncher('1.10.2');

// 打印进度信息
function printProgress(event) {
	// Minecraft核心jar下载进度通知
	event.on('core_process', function (p){
		console.log(`core下载中...${p}%`);
	});
	// Minecraft依赖类库下载进度通知
	event.on('libraries_process', function (p) {
		if(p.skip){
			console.info(`down lib \t exists \t [${p.file}] [${p.count}/${p.total}] skip.`);
		} else {
			console.log(`down lib \t not exists \t [${p.file}] [${p.count}/${p.total}] dowloaded.`);
		}
	});
	// Minecraft依赖运行库下载进度通知
	event.on('natives_process', function (p) {
		console.log(`down native \t [${p.count}/${p.total}] dowloaded.`);
	});
	// Minecraft依赖静态资源下载进度通知
	event.on('assets_process', function (p) {
		console.log(`down assets \t [${p.count}/${p.total}] dowloaded.`);
	});
	// 启动失败通知
	event.on('launch_error', function (err) {
		console.log(`launch error ${err}.`);
	});
	// 启动日志消息通知
	event.on('launch_message', function (data) {
		console.log(`launch output message ${data}.`);
	});
	// Minecraft游戏退出通知
	event.on('launch_exit', function (code) {
		console.log(`launch exit code ${code}.`);
	});
}

/**
 * 开始下载并启动游戏
 * @param  {function} printProgress 接受通知，处理函数
 * @return {object}               Promise
 */
launcher.launchGame(printProgress).then(function () {
	console.log('游戏启动完毕...');
}).catch(function(err) {
	console.error(`启动游戏出现错误...${err}`);
});
```

# Run Example

```bash
git clone https://github.com/52mc/McLauncherNode
cd McLauncherNode
npm install
npm run watch
node ./example/test.js
```

# Build

```bash
npm start // build
npm run watch // build & watch
```
