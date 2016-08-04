const fs = require('fs');
const io = require('./io');

module.exports = class McConfig {

  _default = {
    player: 'Unknow',
    xmx: 256,
    xms: 1024,
    version: '0.0.0',
    area: {
      width: 854,
      height: 480
    },
    jre: {
      version: '',
      home: ''
    },
    downloaded: [],
    forge: {
      flag: false,
      version: '1.10.2 - 12.18.1.2045'
    }
  }

  /**
   * McConfig构造
   * @param  {string} local McConfig配置文件本地缓存路径
   * @return {object}       McConfig对象
   */
  constructor(local) {
    this.local = local;
    this.config = this._readCache(this.local);
  }

  /**
   * 从硬盘读取JSON配置文件
   * @param {string} 硬盘本地路径
   * @return {object} 配置文件javascript对象
   */
  _readCache(path) {
    if (fs.existsSync(path)) {
      var res = io.readFileSync(path);
      return JSON.parse(res);
    } else {
      this._writeCache(path, this._default);
      return this._default;
    }
  }

  _writeCache(path, config) {
    io.writeFileSync(path, JSON.stringify(config));
  }

  set(key, value) {
    if (value === undefined) {
      this.config = key;
    } else {
      this.config[key] = value;
    }
    this._writeCache(this.local, this.config);
    console.log(`set config [${key}] : [${value}]`);
  }

  get(key) {
    return key === undefined ? this.config : this.config[key];
  }

}
