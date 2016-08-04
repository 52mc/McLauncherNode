const path = require('path');
const sep = path.sep;
const arch = process.arch;

module.exports = class StandardLibraries {

	/**
	 * 构造函数
	 * @param  {object} content  mojang version json object
	 * @param  {string} platform 系统类型，可选值：osx, windows, linux
	 * @return {object}          StandardLibraries Object instance
	 */
	constructor(basedir, content, platform) {
		this.basedir = basedir;
		this.content = content;
		this.platform = platform;
		this.sep = platform === 'windows' ? ';' : ':';
	}

	/**
	 * 获取启动脚本的lib依赖字符串
	 * @return {string}          启动脚本的lib依赖字符串
	 */
	buildArgs() {
		const dest = this.getlibsAndNativesFromLibraries();
		const standardlibraries = dest.libraries;
		var args = '';
		standardlibraries.forEach(lib => {
			if (lib.allows.indexOf(this.platform) === -1) {
				return;
			} else {
				args += path.normalize(
					`${this.basedir}${sep}${lib.absolute}${this.sep}`);
			}
		});
		return args;
	}

	// 获取从原始的Libraries中获取libs和natives并转换为标准的libs和natives格式
	getlibsAndNativesFromLibraries() {
		const libraries = this.content.libraries;
		var libs = [];
		var natives = [];
		libraries.map((item, index) => {
			const allows = this._getAllowOsForLib(item);
			// console.log(`${index+1}\t${allows}\t${item.name}`);
			var lib = {};
			// force
			if (!item.downloads) {
				// net.minecraftforge:forge:1.10.2-12.18.1.2027
				const t = item.name.split(':');
				var local = item.installer === true ?
					`${t[0].replace(/\./g, sep)}${sep}${t[1]}${sep}${t[2]}${sep}${t[1]}-${t[2]}-universal.jar` :
					`${t[0].replace(/\./g, sep)}${sep}${t[1]}${sep}${t[2]}${sep}${t[1]}-${t[2]}.jar`;
				lib = this._transferStandardLib({
					path: local,
					url: `${item.url}${local}`,
					sha1: '',
					size: 0,
					force: true
				});
				lib.allows = allows;
				libs.push(lib);
				return;
			}
			// normal
			const artifact = item.downloads.artifact;
			if (artifact !== undefined) {
				lib = this._transferStandardLib(artifact);
				lib.allows = allows;
				libs.push(lib);
			} else {
				var key = item.natives[this.platform];
				if (key === undefined) {
					return;
				}
				// 替换windows的arch
				if (key.indexOf('${arch}') !== -1) {
					key = key.replace('${arch}', arch);
				}
				const classifiers = item.downloads.classifiers;
				const native_artifact = classifiers[key];
				lib = this._transferStandardLib(native_artifact);
				lib.allows = [this.platform];
				natives.push(lib);
			}
		});
		return {
			libraries: libs,
			natives: natives
		}
	}

	/**
	 * 将artifact转换成标准的lib格式
	 * @param  {object} artifact json中的artifact
	 * @return {object}          格式化后标准的artifact
	 */
	_transferStandardLib(artifact) {
		const absolute = artifact.path;
		var standardlib = {
			absolute: absolute,
			basename: path.dirname(absolute),
			filename: path.basename(absolute),
			url: artifact.url,
			sha1: artifact.sha1,
			size: artifact.force ? 0 : artifact.size
		};
		return standardlib;
	}

	/**
	 * 获取此lib允许的系统类型
	 * @param  {object} lib librarie项
	 * @return {array}     允许的系统类型集合
	 */
	_getAllowOsForLib(lib) {
		// 假设所有类型的类型都需要加载此lib
		var allows = ['windows', 'osx', 'linux'];
		lib.rules && lib.rules.forEach(rule => {
			// 排除不需要加载的
			const action = rule.action;
			const os = rule.os;
			// 需要加载
			if (action === 'allow') {
				if (os !== undefined) {
					// 指定系统，代表只在此系统下加载
					allows = [os.name];
				}
			} else if (action === 'disallow') {
				// 不需要加载
				if (os) {
					// 排除指定系统
					allows.splice(allows.indexOf(os.name), 1);
				} else {
					// 排除所有系统
					allows = [];
				}
			}
		});
		return allows;
	}

}
