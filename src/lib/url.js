const cdn = 'http://7xwoig.com1.z0.glb.clouddn.com';

const manifest = `https://launchermeta.mojang.com/mc/game/version_manifest.json`;
const client = `${cdn}/versions/<version>.jar`;
const versions = `${cdn}/versions/list.json`;
const libraries = 'https://libraries.minecraft.net';
const librariesCN = `${cdn}/libraries`;
const assetsCDN = `${cdn}/assets/<index>/<hash>`;
const assetsJsonCDN = `${cdn}/assets/<key>.json`;

const forgeLibraries = 'https://raw.githubusercontent.com/MinecraftForge/MinecraftForge/1.10.x/jsons/<version>-rel.json';

module.exports = {

  manifest: manifest,

  /* 获取客户端Jar URL */
  getClientUrl(version) {
    return client.replace(/<version>/g, version);
  },

  /* 获取版本列表URL */
  getVersionsUrl() {
    return versions;
  },

  /* 获取Java依赖库URL */
  getLibrariesForChinaUser(url) {
    const _url = url.replace(libraries, librariesCN);
    console.log('libraries url:', _url);
    return _url;
  },

  /* 获取assets URL */
  getAssetsForChinaUser(index, hash) {
    const _url = assetsCDN.replace(/<index>/g, index).replace(/<hash>/g, hash);
    console.log('assets url:', _url);
    return _url;
  },

  /* 获取assets Json URL */
  getAssetJsonForChinaUser(key) {
    const _url = assetsJsonCDN.replace(/<key>/g, key);
    console.log('assetsJson url:', _url);
    return _url;
  },

  /* 获取forge libraries json url */
  getForgeLibraries(version) {
    const _url = forgeLibraries.replace(/<version>/g, version);
    console.log('forgeLibraries url:', _url);
    return _url;
  }
}
