const path = require('path');
const joinPath = path.join;

const USER_HOME = process.platform === 'win32' ? (process.env.USERPROFILE || '') : (process.env.HOME || process.env.HOMEPATH || '');
const WORKSPACE = joinPath(USER_HOME, '.McLauncherTest');
const CONFIG = joinPath(WORKSPACE, 'config.json');
const VERSIONS = joinPath(WORKSPACE, 'versions.json');

const GAMEHOME = joinPath(WORKSPACE, '/minecraft/');

module.exports = {
	USER_HOME: USER_HOME,
	WORKSPACE: WORKSPACE,
	GAMEHOME: GAMEHOME,
	CONFIG: CONFIG,
	VERSIONS: VERSIONS
}
