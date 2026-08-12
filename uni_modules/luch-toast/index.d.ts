export type ToastIcon = 'success' | 'error' | 'fail' | 'exception' | 'loading' | 'none'

export interface ToastResult {
	errMsg?: string
	ignored?: boolean
	[key: string]: unknown
}

export type EmptyTitlePolicy = 'reject' | 'ignore'

export interface ToastOptions {
	title?: string
	icon?: ToastIcon
	image?: string
	mask?: boolean
	duration?: number
	position?: 'top' | 'center' | 'bottom'
	xDelay?: number
	xEmptyTitle?: EmptyTitlePolicy
	onSuccess?: (result: ToastResult) => void
	onFail?: (error: ToastResult | Error) => void
	onComplete?: (result: ToastResult | Error) => void
	[key: string]: unknown
}

export type ToastMethodConfig = Omit<ToastOptions, 'title'>
export type ToastMethodsConfig = Record<string, ToastMethodConfig>

export interface ToastBuiltInDefaults {
	success: ToastMethodConfig
	error: ToastMethodConfig
	fail: ToastMethodConfig
	exception: ToastMethodConfig
	loading: ToastMethodConfig
	warning: ToastMethodConfig
}

export type ToastCreateOptions<TMethods extends ToastMethodsConfig = ToastMethodsConfig> = ToastOptions & {
	success?: ToastOptions
	error?: ToastOptions
	fail?: ToastOptions
	exception?: ToastOptions
	loading?: ToastOptions
	warning?: ToastOptions
	methods?: TMethods
}

export type ToastDefaults<TMethods extends ToastMethodsConfig = ToastMethodsConfig> =
	ToastOptions & ToastBuiltInDefaults & { methods: TMethods }

export interface ToastShortcut {
	(title: string, config?: ToastOptions): Promise<ToastResult>
}

export type CustomToastMethods<TMethods extends ToastMethodsConfig> = {
	[MethodName in keyof TMethods]: ToastShortcut
}

export type ToastInstance<TMethods extends ToastMethodsConfig = Record<never, never>> = {
	(title: string, config?: ToastOptions): Promise<ToastResult>
	(config: ToastOptions): Promise<ToastResult>
	readonly defaults: ToastDefaults<TMethods>
	success: ToastShortcut
	error: ToastShortcut
	fail: ToastShortcut
	exception: ToastShortcut
	loading: ToastShortcut
	warning: ToastShortcut
	create<TCustomMethods extends ToastMethodsConfig = Record<never, never>>(
		config?: ToastCreateOptions<TCustomMethods>
	): ToastInstance<TCustomMethods>
} & CustomToastMethods<TMethods>

export function createToast<TMethods extends ToastMethodsConfig = Record<never, never>>(
	config?: ToastCreateOptions<TMethods>
): ToastInstance<TMethods>
export const toast: ToastInstance
export default toast
