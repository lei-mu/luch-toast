# luch-toast

> 轻量的 `uni.showToast` 项目级封装

`luch-toast` 不是 Toast UI 组件。它不渲染或替换提示界面，而是基于 uni-app 原生 `uni.showToast`，为项目提供统一的公共配置、多实例、自定义快捷方法、延迟调用和标准 Promise。


## 安装

从 DCloud 插件市场导入后，插件位于 `uni_modules/luch-toast`。

```js
import toast from '@/uni_modules/luch-toast/index.js'
```

同时支持具名导入：

```js
import { toast, createToast } from '@/uni_modules/luch-toast/index.js'
```

## 基础用法

```js
await toast('普通提示')
await toast.success('操作成功')
await toast.error('操作失败')
await toast.fail('请求失败')
await toast.exception('发生异常')
await toast.loading('加载中')
await toast.warning('请注意')
```

这些快捷方法只提供默认配置，不会锁定 `icon`。例如 `error()` 默认使用 `icon: 'error'`，实例配置或单次配置均可覆盖：

```js
await toast.error('操作失败', {
	icon: 'none'
})
```

也可以直接传入配置：

```js
await toast({
	title: '保存成功',
	icon: 'success',
	duration: 2000
})
```

以上所有调用都会返回标准 Promise：

```js
toast.success('保存成功')
	.then((result) => {
		console.log('调用成功', result)
	})
	.catch((error) => {
		console.error('调用失败', error)
	})
```

Promise 在 `uni.showToast` 的 `success` 回调触发时 resolve，在 `fail` 回调触发时 reject。它表示原生 API 调用结果，不表示 Toast 已展示完毕。

## 默认全局配置

默认导出的 `toast` 本身也是一个实例。它的 `toast.defaults` 初始结构如下：

```js
{
	xEmptyTitle: 'reject',
	success: {
		icon: 'success'
	},
	error: {
		icon: 'error'
	},
	fail: {
		icon: 'fail'
	},
	exception: {
		icon: 'exception'
	},
	loading: {
		icon: 'loading'
	},
	warning: {
		icon: 'none'
	},
	methods: {}
}
```

普通 `toast('提示')` 调用还会使用内部默认的 `icon: 'none'`。它是调用时的兜底值，因此不会作为 `none` 配置出现在 `toast.defaults` 中。`xDelay`、`duration`、`mask` 和生命周期默认不设置，所以也不会出现在初始对象中。

全局默认配置可以实时修改，后续调用立即生效：

```js
toast.defaults.duration = 2000
toast.defaults.mask = true
toast.defaults.error.icon = 'none'
toast.defaults.xEmptyTitle = 'ignore'
```

## 创建实例

`create()` 创建拥有独立默认配置的实例：

```js
const shortToast = toast.create({
	duration: 1000,
	mask: true,
	success: {
		icon: 'none',
		duration: 1500
	},
	error: {
		duration: 3000
	}
})

await shortToast.success('保存成功')
```

支持 `success`、`error`、`fail`、`exception`、`loading`、`warning` 六种内置快捷方法配置，不提供 `none` 配置。普通调用使用公共配置和内部默认的 `icon: 'none'`。

`create()` 配置中的**顶层字段是公共配置**，会应用到该实例的普通调用、所有内置快捷方法和所有自定义快捷方法：

```js
const appToast = toast.create({
	// 顶层公共配置
	duration: 2000,
	mask: true,
	xDelay: 0,
	xEmptyTitle: 'reject',
	onSuccess(result) {},
	onFail(error) {},
	onComplete(result) {},

	// 仅应用于对应快捷方法
	error: {
		duration: 3000
	},

	// 自定义快捷方法配置
	methods: {
		myError: {
			icon: 'error'
		}
	}
})
```

其中 `success`、`error`、`fail`、`exception`、`loading`、`warning` 和 `methods` 不是公共原生参数；`onXxx`、`xDelay`、`xEmptyTitle` 是插件扩展配置，使用后不会透传给 `uni.showToast`。

配置合并顺序如下，右侧优先级更高：

```text
内置方法默认配置 < 实例公共配置 < 实例快捷方法配置 < 单次调用配置
```

## 自定义快捷方法

通过 `methods` 在创建实例时注册自定义快捷方法。方法配置只是一组默认参数，不要求对应某个固定 `icon`：

```js
const myToast = toast.create({
	duration: 1000,
	methods: {
		myWarning: {
			icon: 'none',
			duration: 2500
		},
		myError: {
			icon: 'error',
			mask: true
		}
	}
})

await myToast.myWarning('请检查输入')
await myToast.myError('提交失败', {
	icon: 'none'
})
```

方法名必须是合法的 JavaScript 标识符，且不能覆盖 `create`、`defaults` 或内置快捷方法。自定义方法只在 `create()` 时注册；运行时向 `defaults.methods` 增加字段不会自动生成新方法。

## 修改默认配置

每个实例公开独立且实时生效的 `defaults`：

```js
myToast.defaults.duration = 2000
myToast.defaults.error.icon = 'none'
myToast.defaults.methods.myError.mask = false
```

允许修改 `defaults` 的内部字段，但不允许整体替换：

```js
myToast.defaults.duration = 2000 // 支持
myToast.defaults = {} // 不支持
```

## 延迟显示

使用扩展参数 `xDelay` 调度原生 API，单位为毫秒。该参数会在调用前移除，不会传给 `uni.showToast`。

```js
await toast.success('稍后显示', {
	xDelay: 500
})
```

`xDelay` 是否存在会影响调用时机：

| 配置 | 行为 |
| --- | --- |
| 未设置 | 在当前任务中直接调用 `uni.showToast` |
| `0` | 通过 `setTimeout(..., 0)` 进入宏任务 |
| 正数 | 延迟指定毫秒后调用 |

`xDelay` 必须是有限的非负数。负数、字符串、`NaN` 和无穷值会返回 rejected Promise。

## 空标题策略

`xEmptyTitle` 决定空字符串标题的处理方式，默认值为 `reject`：

```js
const quietToast = toast.create({
	xEmptyTitle: 'ignore'
})

const result = await quietToast('')
// {
//   errMsg: 'showToast:ignored empty title',
//   ignored: true
// }
```

| 值 | 行为 |
| --- | --- |
| `reject` | 返回 rejected Promise，不调用 `uni.showToast` |
| `ignore` | 执行成功和完成生命周期，返回 resolved Promise，不调用 `uni.showToast` |

`xEmptyTitle` 支持实例配置、快捷方法配置和单次配置，并会在调用前移除。缺失标题或非字符串标题始终 reject，不受该配置影响。

## 生命周期

实例和单次调用均支持 `onSuccess`、`onFail`、`onComplete`：

```js
const appToast = toast.create({
	onSuccess(result) {
		console.log('调用成功', result)
	},
	onFail(error) {
		console.error('调用失败', error)
	},
	onComplete(result) {
		console.log('调用结束', result)
	}
})

await appToast.success('完成', {
	onSuccess(result) {
		console.log('本次调用成功', result)
	}
})
```

单次回调先于实例回调执行。所有普通调用、内置快捷方法和自定义快捷方法都会返回 Promise。

## 注意事项

- 多实例只隔离默认配置。底层仍是全局原生 Toast，无法同时展示多个提示。
- `error`、`fail`、`exception`、`loading` 的支持范围由各平台的 `uni.showToast` 实现决定。
- 快捷方法的默认 `icon` 可以通过实例配置、`defaults` 或单次配置覆盖。
- `title` 必须是字符串；空字符串按 `xEmptyTitle` 处理，其他无效参数返回 rejected Promise。

## License

MIT
