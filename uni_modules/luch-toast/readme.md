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

## 动态 icon

`icon` 除了直接传原生图标字符串，也可以传函数。函数在调用 `uni.showToast` 前执行：

```js
icon(title, context) {}
```

- `title`：本次 Toast 的标题。
- `context.defaultIcon`：本次调用在**不使用 icon 函数**时，本来会展示的图标。
- `context.methodName`：快捷方法名，例如 `error`、`loading`；普通 `toast('提示')` 调用时为 `undefined`。

`defaultIcon` 不属于公共配置、快捷方法配置或单次配置中的任何一层。它是每次调用时，排除所有 `icon` 函数后，按现有优先级计算出的最终静态图标：

```text
单次静态 icon > 快捷方法静态 icon > 公共静态 icon > 内置图标
```

内置图标如下：

| 调用方式 | 内置图标 |
| --- | --- |
| `toast('提示')` | `none` |
| `toast.success('提示')` | `success` |
| `toast.error('提示')` | `error` |
| `toast.fail('提示')` | `fail` |
| `toast.exception('提示')` | `exception` |
| `toast.loading('提示')` | `loading` |
| `toast.warning('提示')` | `none` |

例如，未配置其他静态图标时：

```js
toast.error('失败', {
	icon(title, { defaultIcon, methodName }) {
		// defaultIcon 为 'error'，methodName 为 'error'
		return defaultIcon
	}
})
```

若静态配置已覆盖图标，则 `defaultIcon` 使用覆盖后的值：

```js
const appToast = toast.create({
	error: { icon: 'fail' }
})

appToast.error('失败', {
	icon(title, { defaultIcon }) {
		// defaultIcon 为 'fail'
		return defaultIcon
	}
})
```

函数必须返回原生 `uni.showToast` 支持的图标值：`success`、`error`、`fail`、`exception`、`loading` 或 `none`。

当函数返回 `undefined`（包括未写 `return`）时，不改变图标，最终使用 `defaultIcon`：

```js
toast.error('33', {
	icon() {
		return
	}
})
// 最终使用 error 图标
```

### 小程序标题超过 7 个字符时隐藏图标

可将函数配置在顶层公共配置中，统一保留原图标或在标题超过 7 个字符时改为 `none`：

```js
const appToast = toast.create({
	icon(title, { defaultIcon }) {
		return title.length > 7 ? 'none' : defaultIcon
	}
})

await appToast.error('提交失败') // 使用 error 图标
await appToast.error('提交失败，请稍后重试') // 使用 none 图标
```

函数配置也遵循原有优先级：单次 `icon` 函数优先于快捷方法 `icon` 函数，快捷方法 `icon` 函数优先于公共 `icon` 函数。同一次调用只执行优先级最高的一个函数。

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
