import assert from 'node:assert/strict'
import test from 'node:test'

import toast, { createToast } from '../uni_modules/luch-toast/index.js'

function mockUni(handler) {
	globalThis.uni = {
		showToast(config) {
			handler(config)
		}
	}
}

test('普通调用使用 none 图标并返回 Promise', async () => {
	mockUni((config) => {
		assert.equal(config.title, '普通提示')
		assert.equal(config.icon, 'none')
		config.success({ errMsg: 'showToast:ok' })
		config.complete({ errMsg: 'showToast:ok' })
	})

	const result = await toast('普通提示')
	assert.equal(result.errMsg, 'showToast:ok')
})

test('实例配置、快捷方法配置和调用配置按优先级合并', async () => {
	const instance = createToast({
		duration: 1000,
		mask: false,
		error: {
			duration: 2000,
			mask: true
		}
	})

	mockUni((config) => {
		assert.equal(config.title, '失败')
		assert.equal(config.icon, 'success')
		assert.equal(config.duration, 3000)
		assert.equal(config.mask, true)
		config.success({ errMsg: 'showToast:ok' })
	})

	await instance.error('失败', { duration: 3000, icon: 'success' })
})

test('快捷方法图标只是默认值并允许覆盖', async () => {
	const instance = createToast({
		error: {
			icon: 'none'
		}
	})
	const icons = []

	mockUni((config) => {
		icons.push(config.icon)
		config.success({ errMsg: 'showToast:ok' })
	})

	await toast.error('内置默认')
	await instance.error('实例默认')
	await instance.error('单次覆盖', { icon: 'success' })
	assert.deepEqual(icons, ['error', 'none', 'success'])
})

test('defaults 可实时修改但不可整体替换', async () => {
	const instance = createToast({ duration: 800 })
	instance.defaults.duration = 1200
	instance.defaults.error.icon = 'none'

	mockUni((config) => {
		assert.equal(config.duration, 1200)
		assert.equal(config.icon, 'none')
		config.success({ errMsg: 'showToast:ok' })
	})

	await instance.error('实时配置')
	assert.throws(() => {
		instance.defaults = {}
	}, TypeError)
})

test('create 注册自定义快捷方法并推迟到调用时读取配置', async () => {
	const instance = createToast({
		duration: 1000,
		methods: {
			myError: {
				icon: 'error',
				duration: 2000
			}
		}
	})
	instance.defaults.methods.myError.icon = 'none'
	const configs = []

	mockUni((config) => {
		configs.push({ icon: config.icon, duration: config.duration })
		config.success({ errMsg: 'showToast:ok' })
	})

	await instance.myError('实例默认')
	await instance.myError('单次覆盖', { icon: 'success', duration: 3000 })
	assert.deepEqual(configs, [
		{ icon: 'none', duration: 2000 },
		{ icon: 'success', duration: 3000 }
	])

	instance.defaults.methods.myWarning = { icon: 'none' }
	assert.equal(instance.myWarning, undefined)
})

test('自定义方法拒绝无效名称和保留名称', () => {
	assert.throws(() => createToast({
		methods: {
			'my-error': { icon: 'error' }
		}
	}), /invalid toast method name/)
	assert.throws(() => createToast({
		methods: {
			create: { icon: 'error' }
		}
	}), /reserved toast method name/)
})

test('不同实例之间的默认配置相互隔离', async () => {
	const shortToast = createToast({ duration: 800 })
	const longToast = createToast({ duration: 3000 })
	const durations = []

	mockUni((config) => {
		durations.push(config.duration)
		config.success({ errMsg: 'showToast:ok' })
	})

	await shortToast('短提示')
	await longToast('长提示')
	assert.deepEqual(durations, [800, 3000])
})

test('调用不会修改用户传入的配置对象', async () => {
	const config = {
		duration: 2000,
		xDelay: 0
	}

	mockUni((toastConfig) => {
		toastConfig.success({ errMsg: 'showToast:ok' })
	})

	await toast.success('成功', config)
	assert.deepEqual(config, {
		duration: 2000,
		xDelay: 0
	})
})

test('未设置 xDelay 时同步调用原生 API', async () => {
	let invoked = false
	mockUni((config) => {
		invoked = true
		config.success({ errMsg: 'showToast:ok' })
	})

	const promise = toast('同步提示')
	assert.equal(invoked, true)
	await promise
})

test('xDelay 为 0 时进入宏任务且不透传原生 API', async () => {
	const originalSetTimeout = globalThis.setTimeout
	const events = []
	globalThis.setTimeout = (callback, delay) => {
		events.push(`timer:${delay}`)
		callback()
		return 1
	}

	try {
		mockUni((config) => {
			events.push('showToast')
			assert.equal('xDelay' in config, false)
			config.success({ errMsg: 'showToast:ok' })
		})

		await toast('宏任务提示', { xDelay: 0 })
		assert.deepEqual(events, ['timer:0', 'showToast'])
	} finally {
		globalThis.setTimeout = originalSetTimeout
	}
})

test('实例 xDelay 默认值生效', async () => {
	const originalSetTimeout = globalThis.setTimeout
	let scheduledDelay
	globalThis.setTimeout = (callback, delay) => {
		scheduledDelay = delay
		callback()
		return 1
	}

	try {
		const instance = createToast({ xDelay: 0 })
		mockUni((config) => {
			config.success({ errMsg: 'showToast:ok' })
		})
		await instance('实例宏任务')
		assert.equal(scheduledDelay, 0)
	} finally {
		globalThis.setTimeout = originalSetTimeout
	}
})

test('正数 xDelay 延迟调用且不透传扩展参数', async () => {
	const originalSetTimeout = globalThis.setTimeout
	let delayed = false
	globalThis.setTimeout = (callback, delay) => {
		delayed = delay === 500
		callback()
		return 1
	}

	try {
		mockUni((config) => {
			assert.equal('xDelay' in config, false)
			config.success({ errMsg: 'showToast:ok' })
		})

		await toast('延迟提示', { xDelay: 500 })
		assert.equal(delayed, true)
	} finally {
		globalThis.setTimeout = originalSetTimeout
	}
})

test('非法 xDelay 拒绝且不调用原生 API', async () => {
	let invoked = false
	mockUni(() => {
		invoked = true
	})

	await assert.rejects(toast('负数延迟', { xDelay: -1 }), /xDelay/)
	await assert.rejects(toast('字符串延迟', { xDelay: '0' }), /xDelay/)
	await assert.rejects(toast('无限延迟', { xDelay: Infinity }), /xDelay/)
	assert.equal(invoked, false)
})

test('单次回调先于实例回调执行', async () => {
	const calls = []
	const instance = createToast({
		onSuccess() {
			calls.push('instance success')
		},
		onComplete() {
			calls.push('instance complete')
		}
	})

	mockUni((config) => {
		config.success({ errMsg: 'showToast:ok' })
		config.complete({ errMsg: 'showToast:ok' })
	})

	await instance.success('完成', {
		onSuccess() {
			calls.push('call success')
		},
		onComplete() {
			calls.push('call complete')
		}
	})

	assert.deepEqual(calls, [
		'call success',
		'instance success',
		'call complete',
		'instance complete'
	])
})

test('原生失败时拒绝 Promise', async () => {
	const expectedError = { errMsg: 'showToast:fail' }
	mockUni((config) => {
		config.fail(expectedError)
		config.complete(expectedError)
	})

	await assert.rejects(toast.error('失败'), (error) => error === expectedError)
})

test('空标题默认拒绝 Promise', async () => {
	await assert.rejects(toast(), TypeError)
	await assert.rejects(toast({ title: '' }), TypeError)
})

test('xEmptyTitle 为 ignore 时 resolve 且不调用原生 API', async () => {
	const calls = []
	const instance = createToast({
		xEmptyTitle: 'ignore',
		onSuccess(result) {
			calls.push(`success:${result.ignored}`)
		},
		onComplete(result) {
			calls.push(`complete:${result.ignored}`)
		}
	})
	mockUni(() => {
		calls.push('showToast')
	})

	const result = await instance('', {
		onSuccess(value) {
			calls.push(`call-success:${value.ignored}`)
		}
	})

	assert.deepEqual(result, {
		errMsg: 'showToast:ignored empty title',
		ignored: true
	})
	assert.deepEqual(calls, [
		'call-success:true',
		'success:true',
		'complete:true'
	])
})

test('单次 xEmptyTitle 可覆盖实例默认值', async () => {
	const instance = createToast({ xEmptyTitle: 'reject' })
	mockUni(() => {
		assert.fail('空标题不应调用 uni.showToast')
	})

	const result = await instance('', { xEmptyTitle: 'ignore' })
	assert.equal(result.ignored, true)
})

test('非法 xEmptyTitle 拒绝 Promise', async () => {
	await assert.rejects(
		toast('提示', { xEmptyTitle: 'resolve' }),
		/xEmptyTitle/
	)
})
