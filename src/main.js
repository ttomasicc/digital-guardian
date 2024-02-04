const {app, BrowserWindow} = require('electron')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

dotenv.config()

const env = {
	node: process.env.NODE_ENV || 'dev',
	hiddenDirName: process.env.HIDDEN_DIR_NAME || 'dgd',
	pubKeyFileName: process.env.PUBLIC_KEY_FILENAME || 'javni_kljuc.txt',
	privKeyFileName: process.env.PRIVATE_KEY_FILENAME || 'privatni_kljuc.txt',
	secKeyFileName: process.env.SECRET_KEY_FILENAME || 'tajni_kljuc.txt'
}
env.hiddenDirPath = path.join(app.getPath('home'), `.${ env.hiddenDirName }`)

const main = async () => {
	await createHiddenDir()
	const win = await createWindow()
	win.webContents.send('env', env)
}

const createWindow = async () => {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		icon: path.join(__dirname, 'favicon.ico'),
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	await win.loadFile(path.join(__dirname, 'index.html'))

	if (env.node === 'dev') {
		win.webContents.openDevTools()
	}
	win.removeMenu()
	win.show()
	win.maximize()

	return win
}

const createHiddenDir = () => {
	if (!fs.existsSync(env.hiddenDirPath)) {
		fs.mkdirSync(env.hiddenDirPath)
	}
}

app.whenReady().then(main)

app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await createWindow()
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
