const fs = require('fs/promises')
const path = require('path')

exports.readFile = async (filePath) => {
	try {
		await fs.access(filePath, fs.constants.R_OK)
		const content = await fs.readFile(filePath, 'utf8')
		const stats = await fs.stat(filePath)

		return {name: path.basename(filePath), size: stats.size, modified: stats.mtime, content}
	} catch (err) {
		console.error('[ERROR - readFile]:', err.message)

		return {name: '', content: '', modified: '', size: 0}
	}
}

exports.writeFile = async ({filePath, content}) => {
	try {
		await fs.writeFile(filePath, content)
	} catch (err) {
		console.error('[ERROR - writeFile]:', err.message)
	}
}

exports.deleteFile = async (filePath) => {
	try {
		await fs.unlink(filePath)
	} catch (err) {
		console.error('[ERROR - deleteFile]:', err.message)
	}
}
