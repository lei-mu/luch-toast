# Changelog

## 1.0.0

- 提供默认调用实例和 `create()` 多实例能力。
- 提供 `success`、`error`、`fail`、`exception`、`loading` 和 `warning` 方法。
- 支持标准 Promise、实例级与调用级生命周期回调。
- 支持 `xDelay` 延迟显示。
- 支持实时修改实例 `defaults`。
- 支持通过 `methods` 注册自定义快捷方法。
- 快捷方法的默认 `icon` 支持被实例配置和单次配置覆盖。
- 支持通过 `xEmptyTitle` 配置空标题的 reject 或 ignore 策略。
- `xDelay: 0` 支持通过宏任务调用原生 API，并校验非法延迟值。
