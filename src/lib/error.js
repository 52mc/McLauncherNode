module.exports = {
	build: (msg, error) => {
		if(error === undefined) {
			error = new Error(msg);
		}
		console.error(`[ERROR] 出现错误...\nmessage：${error.message}\nstack： ${error.stack}`);
		var str = '';
		for (var i = 0; i < 100; i++) {
			str += '-';
		}
		console.error(str+'\n\n');
		return new Error(msg);
	}
}
