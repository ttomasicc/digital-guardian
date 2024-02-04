const {ipcRenderer} = require('electron')
const configureKeyManagement = require('./keys')
const {readFile} = require('./file')

let keys = {}

const main = async () => {
	const env = await getEnv()
	keys = configureKeyManagement(env)
	await keys.displayExisting()

	setListeners()
}

const getEnv = async () => {
	const promise = new Promise(resolve => ipcRenderer.once('env', (_, variable) => resolve(variable)))
	return await promise
}

const setListeners = () => {
	setKeyInfoListeners()
	setCryptoListeners()
	setSignatureListeners()
	setSignatureVerificationListeners()
	setHashListeners()
	setThemeListener()
}

const setKeyInfoListeners = () => {
	addKeyButtonClickEvent('btn_key_gen', async () => {
		await keys.generateAll()
	})

	addKeyButtonClickEvent('btn_key_refresh')


	addKeyButtonClickEvent('btn_key_del', async () => {
		await keys.deleteAll()
	})
}

const setCryptoListeners = () => {
	const fileIn = document.getElementById('in_crypto_file')
	const txtIn = document.getElementById('txt_in')
	const txtOut = document.getElementById('txt_out')

	addButtonClickEvent('btn_crypto', async () => {
		const algo = getAlgorithmInfo()
		switch (algo.act) {
			case 'enc': {
				txtOut.value = await keys.encrypt(txtIn.value, algo.type)
				break
			}
			case 'dec': {
				txtOut.value = await keys.decrypt(txtIn.value, algo.type)
				break
			}
		}
	})

	fileIn.addEventListener('change', fileUpload(txtIn))
	addButtonClickEvent('btn_crypto_download', fileDownload(txtOut))
}

const setSignatureListeners = () => {
	const fileMessageIn = document.getElementById('in_message_file')
	const txtMessageIn = document.getElementById('message_txt_in')
	const txtSignatureOut = document.getElementById('sign_txt_out')
	let signatureTimeout

	fileMessageIn.addEventListener('change', fileUpload(txtMessageIn, () => {
		txtMessageIn.dispatchEvent(new Event('input'))
	}))

	txtMessageIn.addEventListener('input', () => {
		clearTimeout(signatureTimeout)
		signatureTimeout = setTimeout(async () => {
			txtSignatureOut.value = await keys.sign(txtMessageIn.value)
		}, 500)
	})

	addButtonClickEvent('btn_signature_download', fileDownload(txtSignatureOut))
}

const setSignatureVerificationListeners = () => {
	const fileMessageIn = document.getElementById('in_message_file2')
	const fileSignatureIn = document.getElementById('in_signature_file')
	const txtMessage = document.getElementById('txt_message')
	const txtSignature = document.getElementById('txt_signature')
	const btnVerify = document.getElementById('btn_verify_signature')
	const lblVerificationMessage = document.getElementById('lbl_verification_message')

	fileMessageIn.addEventListener('change', fileUpload(txtMessage))
	fileSignatureIn.addEventListener('change', fileUpload(txtSignature))

	addButtonClickEvent('btn_verify_signature', async () => {
		btnVerify.disabled = 'true'
		let success = false
		if (txtMessage.value && txtSignature.value) {
			success = Boolean(await keys.verify(txtMessage.value, txtSignature.value))
		}

		lblVerificationMessage.style.color = success ? 'green' : 'red'
		lblVerificationMessage.textContent = success ? 'Signature match!' : 'Signature mismatch!'
		setTimeout(() => {
			lblVerificationMessage.innerHTML = '&#8203;'
			btnVerify.removeAttribute('disabled')
		}, 2000)
	})
}

const setHashListeners = () => {
	const fileHashIn = document.getElementById('in_hash_file')
	const txtHashIn = document.getElementById('hash_txt_in')
	const txtHashOut = document.getElementById('hash_txt_out')
	let hashTimeout

	fileHashIn.addEventListener('change', fileUpload(txtHashIn, () => {
		txtHashIn.dispatchEvent(new Event('input'))
	}))

	txtHashIn.addEventListener('input', () => {
		clearTimeout(hashTimeout)
		hashTimeout = setTimeout(() => {
			txtHashOut.value = keys.hash(txtHashIn.value)
		}, 500)
	})

	addButtonClickEvent('btn_hash_download', fileDownload(txtHashOut))
}

const setThemeListener = () => {
	const htmlTag = document.getElementsByTagName('html')[0]
	document.getElementById('moon').addEventListener('click', () => {
		const currentTheme = htmlTag.dataset.theme
		htmlTag.dataset.theme = currentTheme === 'light' ? 'dark' : 'light'
	})
}

const fileUpload = (outputEl, successCallback) => async (e) => {
	const inEl = e.target
	const file = inEl.files[0]
	inEl.value = ''
	if (!file) return
	outputEl.value = (await readFile(file.path)).content
	if (successCallback) successCallback()
}

const fileDownload = (inputEl) => () => {
	const blob = new Blob([inputEl.value], {type: 'text/plain'})
	const a = document.createElement('a')
	a.href = URL.createObjectURL(blob)
	a.download = 'result.txt'
	a.click()
}

const getAlgorithmInfo = () => {
	const algoTypeRadios = document.getElementsByName('algo_type')
	const algoActRadios = document.getElementsByName('algo_act')

	return {
		type: getRadioButtonValue(algoTypeRadios),
		act: getRadioButtonValue(algoActRadios)
	}
}

const getRadioButtonValue = (radios) => {
	for (const radio of radios) {
		if (radio.checked) {
			return radio.value
		}
	}
}

const addKeyButtonClickEvent = (btnName, callback) => {
	addButtonClickEvent(btnName, async () => {
		if (callback)
			await callback()
		await keys.displayExisting()
	})
}

const addButtonClickEvent = (btnName, callback) => {
	const btn = document.getElementById(btnName)
	btn.addEventListener('click', async () => {
		btn.ariaBusy = 'true'
		if (callback) await callback()
		btn.ariaBusy = 'false'
	})
}

window.addEventListener('DOMContentLoaded', main)
