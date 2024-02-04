const path = require('path')
const crypto = require('crypto')
const uikit = require('./uikit')
const {readFile, writeFile, deleteFile} = require('./file')

const iv = crypto.randomBytes(16)
const aesType = 'aes-256-cbc'

const generateRSAKeyPair = async () => new Promise((resolve, reject) => {
	crypto.generateKeyPair('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: 'pkcs1',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem'
		}
	}, (err, publicKey, privateKey) => {
		if (err) reject(err)
		resolve({publicKey, privateKey})
	})
})

const generateAES256Key = async () => new Promise((resolve, reject) => {
	crypto.generateKey('aes', {
		length: 256
	}, (err, key) => {
		if (err) reject(err)
		resolve(key.export().toString('base64'))
	})
})

const writeKeys = async ({publicKey, privateKey, secretKey}, env) => {
	const files = [
		{name: env.pubKeyFileName, content: publicKey},
		{name: env.privKeyFileName, content: privateKey},
		{name: env.secKeyFileName, content: secretKey}
	].map((it) => {
		it.filePath = path.join(env.hiddenDirPath, it.name)
		return it
	})

	await Promise.all(files.map(writeFile))
}

const readKeys = async (env) => await Promise.all(
	[env.pubKeyFileName, env.privKeyFileName, env.secKeyFileName]
		.map((it) => path.join(env.hiddenDirPath, it))
		.map(readFile)
)

module.exports = function (env) {
	const hash = (value) => value ? crypto.createHash('sha256').update(value).digest('base64') : ''

	return {
		generateAll: async () => {
			const {publicKey, privateKey} = await generateRSAKeyPair()
			const secretKey = await generateAES256Key()
			const keys = {publicKey, privateKey, secretKey}

			await writeKeys(keys, env)
			return keys
		},
		displayExisting: async () => {
			const container = document.querySelector('#div_key_info')
			const keyFiles = await readKeys(env)
			container.innerHTML = keyFiles.map(uikit.createKeyInfoArticle).join('')
		},
		deleteAll: async () => {
			await Promise.all(
				[env.pubKeyFileName, env.privKeyFileName, env.secKeyFileName]
					.map((it) => path.join(env.hiddenDirPath, it))
					.map(deleteFile)
			)
		},
		encrypt: async (message, algorithm) => {
			const keyFiles = await readKeys(env)
			const buffer = Buffer.from(message)

			try {
				switch (algorithm) {
					case 'aes': {
						const secretKey = keyFiles.find((it) => it.name === env.secKeyFileName)
						if (!secretKey) return ''
						const secretKeyBuffer = Buffer.from(secretKey.content, 'base64')
						const cipher = crypto.createCipheriv(aesType, secretKeyBuffer, iv)
						return Buffer.concat([cipher.update(buffer), cipher.final()]).toString('base64')
					}
					case 'rsa': {
						const publicKey = keyFiles.find((it) => it.name === env.pubKeyFileName)
						if (!publicKey) return ''
						return crypto.publicEncrypt(publicKey.content, buffer).toString('base64')
					}
					default: {
						return ''
					}
				}
			} catch (err) {
				console.error('[ ERROR - encrypt]', err)
				return ''
			}
		},
		decrypt: async (message, algorithm) => {
			const keyFiles = await readKeys(env)
			const buffer = Buffer.from(message, 'base64')

			try {
				switch (algorithm) {
					case 'aes': {
						const secretKey = keyFiles.find((it) => it.name === env.secKeyFileName)
						if (!secretKey) return ''
						const secretKeyBuffer = Buffer.from(secretKey.content, 'base64')
						const decipher = crypto.createDecipheriv(aesType, secretKeyBuffer, iv)
						return Buffer.concat([decipher.update(buffer), decipher.final()]).toString()
					}
					case 'rsa': {
						const privateKey = keyFiles.find((it) => it.name === env.privKeyFileName)
						if (!privateKey) return ''
						return crypto.privateDecrypt(privateKey.content, buffer).toString()
					}
					default: {
						return ''
					}
				}
			} catch (err) {
				console.error('[ ERROR - decrypt]', err)
				return ''
			}
		},
		sign: async (message) => {
			const keyFiles = await readKeys(env)
			const privateKey = keyFiles.find((it) => it.name === env.privKeyFileName)
			if (!privateKey) return ''

			try {
				return crypto
					.privateEncrypt(privateKey.content, Buffer.from(hash(message), 'base64'))
					.toString('base64')
			} catch (err) {
				console.error('[ ERROR - sign]', err)
				return ''
			}
		},
		verify: async (message, signature) => {
			const keyFiles = await readKeys(env)
			const publicKey = keyFiles.find((it) => it.name === env.pubKeyFileName)
			if (!publicKey) return ''

			try {
				const inputHash = hash(message)
				const signatureBuffer = Buffer.from(signature, 'base64')
				const decryptedHash = crypto.publicDecrypt(publicKey.content, signatureBuffer).toString('base64')
				return inputHash === decryptedHash
			} catch (err) {
				console.error('[ ERROR - verify]', err)
				return ''
			}
		},
		hash
	}
}
