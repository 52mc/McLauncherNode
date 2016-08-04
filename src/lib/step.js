const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const admZip = require('adm-zip');
const Folder = require('./folder');
const Url = require('./url');
const IO = require('./io');
const Error = require('./error');
const Constants = require('./constants');
const McConfig = require('./config');
const Manifest = require('./manifest');
const StandardLibraries = require('./standardlibraries');
const { assignIn } = require('lodash');
const uuid = require('node-uuid');
const { spawn } = require('child_process');
const platform = (function(platform) {
	var os;
	switch (platform) {
		case 'win32':
			os = 'windows';
			break;
		case 'darwin':
			os = 'osx';
			break;
		case 'linux':
		case 'freebsd':
			os = 'linux';
			break;
		default:
			os = 'windows';
			break;
	}
	return os;
})(process.platform);

module.exports = class MinecraftLauncher {

	constructor(version) {
		this.version = version;
		// 是否支持forge
		this.canForge = this.forge();
		this.fd = Folder.init(version);
		this.config = new McConfig(Constants.CONFIG);
	}

	// 从manifest中获取versionJson的下载链接
	getVersionJsonUrlInManifest() {
		return new Promise((resolve, reject) => {
			Manifest.init(Url.manifest, Constants.VERSIONS).then(manifest => {
				const vs = manifest.getFormatVersions();
				const v = vs[this.version];
				if (v === undefined) {
					reject(Error.build('游戏版本错误，没有此版本'));
				} else {
					resolve(v.json);
				}
			}).catch(err => {
				reject(Error.build(`Manifest初始化失败`, err));
			});
		});
	}

	// 下载versionJson
	downloadVersionJson() {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.fd.jsonFile)) {
				return resolve();
			}
			this.getVersionJsonUrlInManifest().then(url => {
				// 从互联网拉取文件
				return IO.request(url);
			}).then(text => {
				// 把拉取的文件内容写入到本地磁盘
				return IO.writeFile(this.fd.jsonFile, text);
			}).then(data => {
				resolve();
			}).catch(err => {
				reject(Error.build(`下载VERSION JSON FILE失败`, err));
			});
		});
	}

	config(key, value) {
		this.config.set(key, value);
	}

	forge() {
		var forgeVersions = ['1.6', '1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.7.2', '1.7.9', '1.7.10', '1.7.10-pre4', '1.8', '1.8.8', '1.8.9', '1.9', '1.9.4', '1.10', '1.10.2'];
		return forgeVersions.indexOf(this.version) !== -1;
	}

	downloadForgeVersionJson() {

	}

	// 下载游戏客户端
	dowloadGameCore(progress) {
		return new Promise((resolve, reject) => {
			// jar文件已经下载
			if (fs.existsSync(this.fd.jarFile)) {
				return resolve();
			}
			// 没有json文件
			if (!fs.existsSync(this.fd.jsonFile)) {
				return reject(Error.build(`下载游戏核心失败，没有找到此版本的VERSION JSON文件`));
			}
			// 下载并存储 client jar
			const clientUrl = Url.getClientUrl(this.version);
			IO.downloadFileToDiskPromise(clientUrl, this.fd.jarFile, 10, progress).then(() => {
				resolve();
			}).catch(err => {
				reject(Error.build(`下载游戏核心失败，下载文件失败`, err));
			});
		});
	}

	// 下载游戏依赖类库
	dowloadGameLibraries(process) {
		return new Promise((resolve, reject) => {
			// 创建文件夹
			IO.createFolders(this.fd.libs);
			console.info(`created ${this.fd.libs} folder.`);
			IO.createFolders(this.fd.natives);
			console.info(`created ${this.fd.natives} folder.`);
			IO.createFolders(this.fd.temps);
			console.info(`created ${this.fd.temps} folder.`);
			// 没有json文件
			if (!fs.existsSync(this.fd.jsonFile)) {
				return reject(Error.build(`下载游戏依赖类库失败，没有找到此版本的VERSION JSON文件`));
			}
			// 存在lock文件
			if (fs.existsSync(this.fd.libLockFile)) {
				return resolve();
			}
			// VERSION JSON文件
			var indexFile = JSON.parse(IO.readFileSync(this.fd.jsonFile));

			const standard = new StandardLibraries(this.fd.libs, indexFile, platform);
			const dest = standard.getlibsAndNativesFromLibraries();
			const natives = dest.natives;
			const libraries = dest.libraries;
			const fd = this.fd;

			// 下载libraries
			(Promise.coroutine(function*() {
				for (var i = 0; i < libraries.length; i++) {
					var lib = libraries[i];
					const liburl = lib.url;
					// /path/to/jar/xxx.jar
					const fullpath = `${fd.libs}${lib.absolute}`;
					// /path/to/jar
					const basename = `${fd.libs}${lib.basename}`;
					// xxx.jar
					const filename = lib.filename;

					// 跳过已经下载的lib
					if (fs.existsSync(fullpath)) {
						var stat = yield IO.stat(fullpath);
						if (stat && (lib.size === 0 || stat.size === lib.size)) {
							process('libraries_process', {
								count: i + 1,
								total: libraries.length,
								file: filename,
								skip: true
							});
							continue;
						} else {
							console.warn('lib文件已经存在，但是size不一致');
						}
					}
					yield IO.createFolders(basename); //需要将文件名截取掉，只建立文件夹 /path/to/file.jar --> /path/to
					yield IO.downloadFileToDiskPromise(Url.getLibrariesForChinaUser(liburl), fullpath, 10);
					process('libraries_process', {
						count: i + 1,
						total: libraries.length,
						file: filename,
						skip: false
					});
				}

				// natives
				for (var i = 0; i < natives.length; i++) {
					const lib = natives[i];
					const url = lib.url;
					const filename = lib.filename;
					const tempfile = `${fd.temps}${filename}`;
					if (fs.existsSync(tempfile)) {
						var stat = yield IO.stat(tempfile);
						if (stat && stat.size === lib.size) {
							continue;
						} else {
							console.warn('natives lib 已经存在，但size不一致')
						}
					}
					yield IO.downloadFileToDiskPromise(Url.getLibrariesForChinaUser(url), tempfile, 10);
					yield IO.wait(200);
					try {
						var zip = new admZip(tempfile);
						zip.extractAllTo(fd.natives, true);
						process('natives_process', {
							count: i + 1,
							total: natives.length
						});
					} catch (e) {
						reject(Error.build(`extract file: ${tempfile} to native folder error`));
					}
				};
				IO.writeFileSync(fd.libLockFile, '');
				resolve();
			}))();

		});
	}

	// 下载游戏资源文件，(声音，图片，等等)
	dowloadGameAssets(process) {
		return new Promise((resolve, reject) => {
			if (!fs.existsSync(this.fd.jsonFile)) {
				return reject(`下载游戏资源文件失败，没有找到此版本的VERSION JSON文件`);
			}
			const fd = this.fd;

			(Promise.coroutine(function*() {
				const indexFile = JSON.parse(yield IO.readFile(fd.jsonFile)); //索引文件
				const assetsid = indexFile.assets;
				const assetFd = Folder.init(assetsid);
				console.info(`资源Id：${assetsid}`);
				if (fs.existsSync(assetFd.assetsLockFile)) {
					console.log(`Assets ${assetsid} lock file exists.`);
					return resolve();
				}

				const fd_assets_indexes = `${fd.assets}${assetsid}/indexes/`;
				const fd_assets_objects = `${fd.assets}${assetsid}/objects/`;
				const assetsIndex = `${fd_assets_indexes}${assetsid}.json`;

				yield IO.createFolders(fd_assets_indexes);
				yield IO.createFolders(fd_assets_objects);

				var assetsList = yield IO.request(Url.getAssetJsonForChinaUser(assetsid));
				IO.writeFileSync(assetsIndex, assetsList);
				assetsList = JSON.parse(assetsList);

				var taskCount = Object.keys(assetsList.objects).length;
				var taskDone = 0;
				var taskError = 0;

				console.log('taskCount:', taskCount);

				/* 通知Assets下载进度方法 */
				function updateAssetsProcess(exists) {
					process({
						count: ++taskDone,
						total: taskCount,
						skip: exists === true
					});

					if (taskDone == taskCount) {
						if (taskError == 0) IO.writeFileSync(assetFd.assetsLockFile, '');
						resolve();
					}
				}

				for (var obj in assetsList.objects) {
					obj = assetsList.objects[obj];
					var hash = obj.hash;
					var index = hash.substring(0, 2);

					var folder = fd_assets_objects + index;
					var fullPath = fd_assets_objects + index + '/' + hash;

					IO.createFolderSync(folder);

					/* 判断是否已经下载过 */
					if (fs.existsSync(fullPath)) {
						var stat = yield IO.stat(fullPath);
						if (stat && stat.size === obj.size) {
							updateAssetsProcess(true);
							continue;
						} else {
							console.log('assets文件已经存在，但是size不一致');
						}
					}

					try {
						yield IO.downloadFileToDiskPromise(Url.getAssetsForChinaUser(index, hash), fullPath, 10);
					} catch (ex) {
						console.log(ex);
						taskError++;
					}
					updateAssetsProcess();
				}

			}))();
		});
	}

	// 启动
	launch(process){
		return new Promise((resolve, reject) => {
			var args = assignIn({
				player: 'unknow',
				xmx: 256,
				xms: 1024,
				area: {
					width: 854,
					height: 480,
				},
				jre: {
					home: ''
				}
			}, this.config.get());
			var JVMArgs = [];
			if (!fs.existsSync(this.fd.jsonFile)) {
				return reject(Error.build('启动游戏失败，没有找到此版本的VERSION JSON文件'));
			}
			JVMArgs.push('-XX:+UseG1GC');
			JVMArgs.push('-XX:-UseAdaptiveSizePolicy');
			JVMArgs.push('-XX:-OmitStackTraceInFastThrow');
			JVMArgs.push(`-Xmn${args.xmx}m`);
			JVMArgs.push(`-Xmx${args.xms}m`);
			JVMArgs.push(`-Djava.library.path=${this.fd.natives}`);
			JVMArgs.push('-Dfml.ignoreInvalidMinecraftCertificates=true');
			JVMArgs.push('-Dfml.ignorePatchDiscrepancies=true');
			JVMArgs.push(`-Duser.home=${this.fd.version}`);
			JVMArgs.push(`-cp`);

			const indexFile = JSON.parse(IO.readFileSync(this.fd.jsonFile)); //索引文件
			const standard = new StandardLibraries(this.fd.libs, indexFile, platform);
			const LoadLibrariesString = standard.buildArgs();
			JVMArgs.push(`${LoadLibrariesString}${this.fd.jarFile}`);
			JVMArgs.push(indexFile.mainClass);

			var ClientUUID = uuid.v4().replace(/-/g, '');
			indexFile.minecraftArguments.split(' ').map(item => {
				switch (item) {
					case '${auth_player_name}':
						item = args.player;
						break;
					case '${version_name}':
						item = '"+1s"';
						break;
					case '${game_directory}':
						item = `${this.fd.game}`;
						break;
					case '${assets_root}':
						item = `${this.fd.assets}${indexFile.assets}`;
						break;
					case '${assets_index_name}':
						item = indexFile.assets;
						break;
					case '${auth_uuid}':
					case '${auth_access_token}':
						item = ClientUUID;
						break;
					case '${user_properties}':
						item = '{}';
						break;
					case '${user_type}':
						item = 'Legacy';
						break;
					case '${version_type}':
						item = '';
						break;
						//1.5.2
					case '${game_assets}':
						item = `${this.fd.assets}`;
						break;
				}
				JVMArgs.push(item);
			});

			JVMArgs.push('--height');
			JVMArgs.push(args.area.height);
			JVMArgs.push('--width');
			JVMArgs.push(args.area.width);
			// 记录最后一次的启动命令
			IO.writeFileSync(this.fd.lastLaunchArgsFile, `${args.jre.home} ${JVMArgs.join(' ')}`);
			IO.createFolderSync(this.fd.game);
			const child = spawn(args.jre.home, JVMArgs, {
				cwd: this.fd.game
			});
			child.on('error', (err) => process('error', err));
			child.stdout.on('data', (data) => process('message', data));
			child.stderr.on('data', (data) => process('message', data));
			child.on('exit', (code) => process('exit', code));
			child.stdout.setEncoding('utf8');
			resolve();
		});
	}

	// 启动游戏
	launchGame(process) {
		const TaskEvent = new EventEmitter();
		process(TaskEvent);
		return new Promise((resolve, reject) => {
			this.downloadVersionJson().then(() => {
				return this.dowloadGameCore((percent) => {
					TaskEvent.emit('core_process', percent);
				})
			}).then(() => {
				return this.dowloadGameLibraries((eventName, process) => {
					TaskEvent.emit(eventName, process);
				});
			}).then((event) => {
				return this.dowloadGameAssets((process) => {
					TaskEvent.emit('assets_process', process);
				});
			}).then(() => {
				return this.launch((eventName, result) => {
					TaskEvent.emit(`launch_${eventName}`, result);
				});
			}).then(() => {
				resolve();
			}).catch(err => reject(Error.build(`启动游戏失败`, err)));
		});
	}

}
