const Promise = require('bluebird');
const spawn = require('child_process').spawn;

/**
 * 运行which命令
 * @param  {string} arg which目标
 * @return {string}     output结果，去掉了末尾的换行符
 */
exports.which = function (arg) {
	var args = [];
	args.push(arg);
  const _ = spawn('which',args);
  return new Promise((resolve, reject) => {
		var output = '';
    _.stdout.setEncoding('utf8');
    _.stdout.on('data', (data) => {
			output = data.replace('\n','');
    });
		_.stdout.on('error', (err) => {
      reject('which error');
    });
		_.stdout.on('close', (code) => {
			if(output === ''){
				reject(`which ${arg} output empty.`);
			}else{
				resolve(output);
			}
		});
  });
}

exports.loadJre = function (){
	return new Promise((resolve, reject) => {
		var local;
		this.loadJrePath().then((bin) => {
			local = bin;
			return this.localJreVersion();
		}).then((version) => {
			if(version === null){
				reject('没有JAVA环境');
			} else {
				resolve({
					path: local,
					version: version
				});
			}
		}).catch((err) => {
			reject(err);
		});
	});
}

exports.loadJrePath = function (){
	return new Promise((resolve, reject) => {
		const Java = this.which('java');
	  Java.then((bin) => {
			resolve(bin);
	  }).catch((err) => {
			reject(err);
	  });
	});
}

/**
 * 获取本地Java版本，获取不到或失败返回null
 * @return {string|object} java版本号，例如：1.7，获取不到则返回null
 */
exports.localJreVersion = function () {
	return new Promise((resolve, reject) => {
		this.loadJrePath().then((bin) => {
			const Version = spawn(bin, ['-version']);
			var output = '';
      Version.stdout.setEncoding('utf8');
			Version.stderr.on('data', (data) => {
				output += data;
			});
			Version.stderr.on('end', () => {
				var vs = /(\w+\.){2}\w+/.exec(output);
				resolve( vs === null ? null : vs[0] );
			});
			Version.on('error', (err) => {
				reject(e);
			});
		}).catch((err) => {
			reject(err);
	  });
	});
}
