# luch-toast

> 轻量的 `uni.showToast` 项目级封装

`luch-toast` 不是 Toast UI 组件。它不渲染或替换提示界面，而是基于 uni-app 原生 `uni.showToast`，为项目提供统一的公共配置、多实例、自定义快捷方法、延迟调用和标准 Promise。

插件源码位于 [`uni_modules/luch-toast`](./uni_modules/luch-toast)，当前仓库同时包含可在 HBuilderX 中运行的 uni-app 示例工程。

## 快速开始

```js
import toast from '@/uni_modules/luch-toast/index.js'

await toast.success('操作成功')

const shortToast = toast.create({
	duration: 1000,
	error: {
		duration: 3000
	},
	methods: {
		myError: {
			icon: 'error',
			mask: true
		}
	}
})

await shortToast.error('操作失败')
await shortToast.myError('自定义失败', { icon: 'none' })

shortToast.defaults.duration = 2000
```

完整 API、配置规则和平台注意事项请查看[插件文档](./uni_modules/luch-toast/readme.md)。

## 开发验证

```powershell
node --test tests/toast.test.mjs
```

界面验证请使用 HBuilderX 运行本仓库的示例工程。

## License

MIT
