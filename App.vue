<script>
	export default {
		data: {
			/**
			 * 基础参数
			 */

			// 数据库
			MAIN_DB: null,
			MAIN_TABLE: 'qrcode_basic',

		},
		onLaunch: function() {
			console.log('App Launch')
			if (!wx.cloud) {
				uni.showModal({
					content: '请使用 2.2.3 或以上的基础库以运行云服务'
				});
			} else {

				//const cloud = require('wx-server-sdk')
				wx.cloud.init({
					/**
					 * env 参数说明
					 * env 参数决定接下来小程序发起的云开发，调用(wx.cloud.xxx)会默认请求到哪个云环境的资源
					 * 此处填入 云环境ID 
					 * 如不填写则默认使用第一个创建的环境
					 */
					env: 'qrcode-to-poster-luody',
					traceUser: true
				});
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	@import "colorui/main.css";
	@import "colorui/icon.css";

	.hideCanvasView {
		position: relative;
	}

	.hideCanvas {
		position: absolute;
		bottom: 0;
		left: -9999rpx;
	}

	/* .hideCanvas {
		position: fixed;
		top: -9999upx;
		left: -9999upx;
		z-index: -9999;
	} */

	.flex_row_c_c {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}

	.modalView {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0;
		outline: 0;
		transform: scale(1.2);
		perspective: 2500upx;
		background: rgba(0, 0, 0, 0.6);
		transition: all .3s ease-in-out;
		pointer-events: none;
		backface-visibility: hidden;
		z-index: 999;
	}

	.modalView.show {
		opacity: 1;
		transform: scale(1);
		pointer-events: auto;
	}

	.flex_column {
		display: flex;
		flex-direction: column;
	}

	.backgroundColor-white {
		background-color: white;
	}

	.border_radius_10px {
		/* border-radius: 10px; */
	}

	.padding1vh {
		/* padding: 1vh; */
	}

	.posterImage {
		width: 80vw;
		/* width: 60vw; */
	}

	.flex_row {
		display: flex;
		flex-direction: row;
	}

	.marginTop2vh {
		margin-top: 2vh;
	}


	.toast-box {
		width: 100%;
		height: 100%;
		opacity: 1;
		position: fixed;
		top: 0px;
		left: 0px;
	}


	.toastbg {
		opacity: 0.2;
		background-color: black;
		position: absolute;
		width: 100%;
		min-height: 100vh;
	}

	.showToast {
		position: absolute;
		opacity: 1;
		width: 70%;
		margin-left: 15%;
		margin-top: 40%;
	}

	.toast-title {
		padding-left: 5%;
		background-color: #2196f3;
		color: white;
		padding-top: 2vh;
		padding-bottom: 2vh;
		border-top-right-radius: 16rpx;
		border-top-left-radius: 16rpx;
	}

	.toast-main {
		padding-top: 2vh;
		padding-bottom: 2vh;
		background-color: white;
		text-align: center;
	}

	.toast-input {
		margin-left: 5%;
		margin-right: 5%;
		border: 1px solid #ddd;
		padding-left: 2vh;
		padding-right: 2vh;
		padding-top: 1vh;
		padding-bottom: 1vh;
	}

	.toast-button {
		display: flex;
	}

	.button1 {
		width: 50%;
	}

	.button2 {
		width: 50%;
	}

	.button1 button {
		width: 100%;
		background-color: white;
		color: red;
		border-radius: 0px;
		border-bottom-left-radius: 16rpx;
	}

	.button2 button {
		width: 100%;
		background-color: white;
		color: black;
		border-radius: 0px;
		border-bottom-right-radius: 16rpx;
	}
</style>
