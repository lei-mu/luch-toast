<script setup>
import { shallowRef } from 'vue'
import toast from '@/uni_modules/luch-toast/index.js'
console.log('toast defaults', toast.defaults);

toast.defaults.onSuccess = (config) => {
	console.log('onsuccess', config)
}
const status = shallowRef('等待操作')
const fastToast = toast.create({
	duration: 800,
	methods: {
		myWarning: {
			icon: 'none',
			duration: 1800
		}
	},
	onSuccess() {
		status.value = '短提示调用成功'
	}
})
fastToast.defaults.mask = false

async function run(action) {
	try {
		await action()
		status.value = `${status.value} · Promise resolved`
	} catch (error) {
		status.value = error?.errMsg || error?.message || '调用失败'
	}
}
</script>

<template>
	<view class="page">
		<view class="header">
			<text class="eyebrow">UNI_MODULES / JS SDK</text>
			<text class="title">luch-toast</text>
			<text class="subtitle">轻量的 uni.showToast 项目级封装</text>
		</view>

		<view class="section">
			<text class="section-title">基础类型</text>
			<view class="button-grid">
				<button class="action-button" @click="run(() => toast('普通提示'))">默认</button>
				<button class="action-button action-success" @click="run(() => toast.success('操作成功'))">成功</button>
				<button class="action-button action-error" @click="run(() => toast.error('操作失败'))">错误</button>
				<button class="action-button" @click="run(() => toast.warning('请注意'))">警告</button>
				<button class="action-button" @click="run(() => toast.loading('加载中'))">加载</button>
				<button class="action-button" @click="run(() => toast.exception('发生异常'))">异常</button>
			</view>
		</view>

		<view class="section">
			<text class="section-title">实例与延迟</text>
			<view class="button-grid button-grid-secondary">
				<button class="action-button" @click="run(() => fastToast.success('800ms 实例'))">短提示实例</button>
				<button class="action-button" @click="run(() => fastToast.myWarning('自定义快捷方法'))">自定义方法</button>
				<button class="action-button" @click="run(() => toast('延迟 500ms', { xDelay: 500 }))">延迟显示</button>
			</view>
		</view>

		<view class="status-bar">
			<text class="status-label">STATUS</text>
			<text class="status-value">{{ status }}</text>
		</view>
	</view>
</template>

<style scoped>
	.page {
		min-height: 100vh;
		box-sizing: border-box;
		padding: 72rpx 36rpx 48rpx;
		background: #f4f5f2;
		color: #171a1c;
	}

	.header {
		display: flex;
		flex-direction: column;
		padding-bottom: 48rpx;
		border-bottom: 2rpx solid #171a1c;
	}

	.eyebrow {
		font-size: 22rpx;
		font-weight: 600;
		color: #596168;
	}

	.title {
		margin-top: 10rpx;
		font-size: 64rpx;
		font-weight: 700;
		line-height: 1.1;
	}

	.subtitle {
		margin-top: 18rpx;
		font-size: 28rpx;
		line-height: 1.6;
		color: #596168;
	}

	.section {
		padding: 44rpx 0 12rpx;
	}

	.section-title {
		display: block;
		margin-bottom: 20rpx;
		font-size: 26rpx;
		font-weight: 600;
	}

	.button-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
	}

	.button-grid-secondary {
		grid-template-columns: 1fr;
	}

	.action-button {
		width: 100%;
		height: 88rpx;
		margin: 0;
		border: 2rpx solid #c7cccf;
		border-radius: 8rpx;
		background: #ffffff;
		color: #171a1c;
		font-size: 28rpx;
		line-height: 84rpx;
	}

	.action-button::after {
		border: 0;
	}

	.action-success {
		border-color: #167451;
		color: #125a40;
	}

	.action-error {
		border-color: #b64040;
		color: #8f2f2f;
	}

	.status-bar {
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
		margin-top: 48rpx;
		padding-top: 24rpx;
		border-top: 2rpx solid #c7cccf;
	}

	.status-label {
		flex: 0 0 auto;
		font-size: 20rpx;
		font-weight: 700;
		color: #167451;
	}

	.status-value {
		min-width: 0;
		font-size: 24rpx;
		line-height: 1.5;
		color: #596168;
		word-break: break-all;
	}
</style>
