// 内置快捷方法仅提供默认配置，实例配置和单次配置均可覆盖。
const BUILT_IN_METHOD_DEFAULTS = {
	success: { icon: 'success' },
	error: { icon: 'error' },
	fail: { icon: 'fail' },
	exception: { icon: 'exception' },
	loading: { icon: 'loading' },
	warning: { icon: 'none' }
}
const BUILT_IN_METHODS = Object.keys(BUILT_IN_METHOD_DEFAULTS)
const BUILT_IN_METHOD_SET = new Set(BUILT_IN_METHODS)
const HOOK_NAMES = ['onSuccess', 'onFail', 'onComplete']
const IGNORED_EMPTY_TITLE_RESULT = {
	errMsg: 'showToast:ignored empty title',
	ignored: true
}
const RESERVED_METHOD_NAMES = new Set([
	...BUILT_IN_METHODS,
	'create',
	'defaults',
	'apply',
	'bind',
	'call',
	'caller',
	'arguments',
	'length',
	'name',
	'prototype',
	'toString'
])
const INSTANCE_ONLY_NAMES = new Set([
	...BUILT_IN_METHODS,
	...HOOK_NAMES,
	'methods'
])
// 正则未使用 g 或 y 标志，多次 test() 不会累积 lastIndex。
const METHOD_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function hasOwn(object, key) {
	return Object.prototype.hasOwnProperty.call(object, key)
}

function isObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeCallConfig(titleOrConfig, config) {
	if (typeof titleOrConfig === 'string') {
		return {
			...(isObject(config) ? config : {}),
			title: titleOrConfig
		}
	}

	return isObject(titleOrConfig) ? { ...titleOrConfig } : null
}

function validateMethod(methodName, methodConfig) {
	if (!METHOD_NAME_PATTERN.test(methodName)) {
		throw new TypeError(`invalid toast method name: ${methodName}`)
	}
	if (RESERVED_METHOD_NAMES.has(methodName)) {
		throw new TypeError(`reserved toast method name: ${methodName}`)
	}
	if (!isObject(methodConfig)) {
		throw new TypeError(`toast method config must be an object: ${methodName}`)
	}
}

function createDefaults(config) {
	const source = isObject(config) ? config : {}
	const defaults = {
		xEmptyTitle: 'reject'
	}

	// 顶层配置是所有调用共享的公共配置，快捷方法和 methods 除外。
	Object.keys(source).forEach((key) => {
		if (BUILT_IN_METHOD_SET.has(key) || key === 'methods') return
		defaults[key] = source[key]
	})

	// 每个实例复制一份快捷方法默认配置，避免实例之间相互污染。
	BUILT_IN_METHODS.forEach((methodName) => {
		defaults[methodName] = {
			...BUILT_IN_METHOD_DEFAULTS[methodName],
			...(isObject(source[methodName]) ? source[methodName] : {})
		}
	})

	defaults.methods = {}
	const customMethods = isObject(source.methods) ? source.methods : {}
	Object.keys(customMethods).forEach((methodName) => {
		const methodConfig = customMethods[methodName]
		validateMethod(methodName, methodConfig)
		defaults.methods[methodName] = { ...methodConfig }
	})

	return defaults
}

function getSharedDefaults(defaults) {
	const shared = {}
	Object.keys(defaults).forEach((key) => {
		if (!INSTANCE_ONLY_NAMES.has(key)) shared[key] = defaults[key]
	})
	return shared
}

function takeHooks(config) {
	const hooks = {}
	// 扩展生命周期不会透传给 uni.showToast。
	HOOK_NAMES.forEach((hookName) => {
		const hook = config[hookName]
		delete config[hookName]
		if (typeof hook === 'function') hooks[hookName] = hook
	})
	return hooks
}

function getDefaultIcon(callConfig, methodDefaults, sharedDefaults, fallbackIcon) {
	const icons = [callConfig.icon, methodDefaults.icon, sharedDefaults.icon, fallbackIcon]
	return icons.find((icon) => icon !== undefined && typeof icon !== 'function')
}

function getIconResolver(callConfig, methodDefaults, sharedDefaults) {
	if (hasOwn(callConfig, 'icon')) {
		return typeof callConfig.icon === 'function' ? callConfig.icon : null
	}
	if (typeof methodDefaults.icon === 'function') return methodDefaults.icon
	return typeof sharedDefaults.icon === 'function' ? sharedDefaults.icon : null
}

function resolveIcon(config, resolver, context) {
	if (resolver) {
		const icon = resolver(config.title, context)
		config.icon = icon === undefined ? context.defaultIcon : icon
	}
}

function runHooks(callHooks, defaults, hookName, payload) {
	if (callHooks[hookName]) callHooks[hookName](payload)
	if (typeof defaults[hookName] === 'function') defaults[hookName](payload)
}

function createToast(instanceConfig = {}) {
	const defaults = createDefaults(instanceConfig)

	function show(titleOrConfig, config, methodName) {
		const callConfig = normalizeCallConfig(titleOrConfig, config)
		if (!callConfig || typeof callConfig.title !== 'string') {
			return Promise.reject(new TypeError('toast title must be a non-empty string'))
		}

		// 配置优先级：内部兜底 < 顶层公共配置 < 快捷方法配置 < 单次配置。
		const methodDefaults = BUILT_IN_METHOD_SET.has(methodName)
			? defaults[methodName]
			: defaults.methods[methodName] || {}
		const sharedDefaults = getSharedDefaults(defaults)
		const toastConfig = {
			icon: 'none',
			...sharedDefaults,
			...methodDefaults,
			...callConfig
		}

		const callHooks = takeHooks(toastConfig)
		// 扩展参数只参与库内部控制，调用原生 API 前必须删除。
		const emptyTitlePolicy = hasOwn(toastConfig, 'xEmptyTitle')
			? toastConfig.xEmptyTitle
			: defaults.xEmptyTitle
		delete toastConfig.xEmptyTitle
		if (emptyTitlePolicy !== 'reject' && emptyTitlePolicy !== 'ignore') {
			return Promise.reject(new TypeError('xEmptyTitle must be "reject" or "ignore"'))
		}

		if (callConfig.title.length === 0) {
			if (emptyTitlePolicy === 'reject') {
				return Promise.reject(new TypeError('toast title must be a non-empty string'))
			}
			// ignore 是一次成功的空操作，仍执行成功与完成生命周期。
			return new Promise((resolve) => {
				const result = { ...IGNORED_EMPTY_TITLE_RESULT }
				resolve(result)
				runHooks(callHooks, defaults, 'onSuccess', result)
				runHooks(callHooks, defaults, 'onComplete', result)
			})
		}

		// icon 函数接收标题及合并后原本应使用的图标信息。
		resolveIcon(toastConfig, getIconResolver(callConfig, methodDefaults, sharedDefaults), {
			defaultIcon: getDefaultIcon(
				callConfig,
				methodDefaults,
				sharedDefaults,
				BUILT_IN_METHOD_SET.has(methodName) ? BUILT_IN_METHOD_DEFAULTS[methodName].icon : 'none'
			),
			methodName
		})

		const hasDelay = hasOwn(toastConfig, 'xDelay')
		const delay = toastConfig.xDelay
		delete toastConfig.xDelay
		if (hasDelay && (!Number.isFinite(delay) || delay < 0)) {
			return Promise.reject(new TypeError('xDelay must be a finite non-negative number'))
		}

		// 自行包装回调，统一 Vue 2、Vue 3 及不同端的 Promise 返回形式。
		return new Promise((resolve, reject) => {
			toastConfig.success = (result) => {
				resolve(result)
				runHooks(callHooks, defaults, 'onSuccess', result)
			}
			toastConfig.fail = (error) => {
				reject(error)
				runHooks(callHooks, defaults, 'onFail', error)
			}
			toastConfig.complete = (result) => {
				runHooks(callHooks, defaults, 'onComplete', result)
			}

			const invoke = () => {
				try {
					uni.showToast(toastConfig)
				} catch (error) {
					reject(error)
					runHooks(callHooks, defaults, 'onFail', error)
					runHooks(callHooks, defaults, 'onComplete', error)
				}
			}

			// 显式 xDelay: 0 也通过 setTimeout 进入下一个宏任务。
			hasDelay ? setTimeout(invoke, delay) : invoke()
		})
	}

	function toast(titleOrConfig, config) {
		return show(titleOrConfig, config)
	}

	// 方法名在实例创建时固定，后续修改 defaults 只更新方法配置。
	BUILT_IN_METHODS.forEach((methodName) => {
		toast[methodName] = (title, config) => show(title, config, methodName)
	})
	Object.keys(defaults.methods).forEach((methodName) => {
		toast[methodName] = (title, config) => show(title, config, methodName)
	})
	toast.create = createToast
	Object.defineProperty(toast, 'defaults', {
		value: defaults,
		writable: false,
		enumerable: true
	})

	return toast
}

const toast = createToast()

export { createToast, toast }
export default toast
