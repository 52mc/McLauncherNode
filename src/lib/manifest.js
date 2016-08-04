const fs = require('fs');
const IO = require('./io');
const Promise = require('bluebird');

/**
 * 从本地读取，或者从mojang服务器获取最新的manifest文件
 * @param {boolean} 是否忽略本地配置，从mojang服务器获取最新的manifest文件，默认为否
 */
function _fetchManifest(url, local) {
	return new Promise((resolve, reject) => {
		if(fs.existsSync(local)){
			// 从硬盘读取JSON配置文件并转换为javascript对象返回
			resolve(JSON.parse(IO.readFileSync(local)));
		} else {
			var manifest;
			IO.request(url).then((text) => {
				manifest = text;
				// 把拉取的文件内容写入到本地磁盘
				return IO.writeFile(local, manifest);
			}).then(() => {
				resolve(JSON.parse(manifest));
			});
		}
	});
}

function _transfer(manifest) {
	var versions = manifest.versions;
	var i = 0;
	var len = versions.length;
	for (; i < len; i++) {
		var version = versions[i];
		version.typeName = _transferType(version.type);
	}
}

function _transferType(type) {
	switch (type){
		case 'release'  : return '正式版';
		case 'snapshot' : return '快照版';
		case 'old_beta' : return '初期内测版';
		case 'old_alpha': return '初期开发版';
		default         : return type;
	}
}

class Manifest {

	constructor(manifest) {
		this.manifest = manifest;
	}

	/**
	 * 获取所有可用版本
	 * @return {array} 所有可用版本集合
	 */
	getAllVersions() {
		if(this.manifest === null){
			return [];
		}
		return this.manifest.versions;
	}

	/**
	 * 获取一个格式化后的所有可用版本对象
	 * @return {object} 格式化后的所有可用版本对象
	 * @example
	 *  => "v0.0.1":{
	 * 		type:'beta',
	 *   	json:'https://xxx.json'
	 * }
	 */
	getFormatVersions() {
		var list = {};
		this.getAllVersions().map(item => {
			list[item.id] = {
				type: item.type,
				json: item.url
			};
		});
		return list;
	}

	/**
	 * 获取最新版本
	 * @return {object} 包含snapshot和release的对象
	 */
	getLatest() {
		if(this.manifest === null){
			return {};
		}
		return this.manifest.latest;
	}
}

module.exports = {
	/**
	 * 初始化Manifest
	 * @param  {string} url   mojang服务器获取manifest文件URL
	 * @param  {string} local 本地缓存路径
	 * @return {object}       一个Manifest对象
	 */
	init: (url, local) => {
		return new Promise((resolve, reject) => {
			_fetchManifest(url, local).then(manifest => {
				_transfer(manifest);
				resolve(new Manifest(manifest));
			}).catch(err => {
				reject(err);
			});
		});
	}
}
