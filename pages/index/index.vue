<template>
	<view class="content">
		<view class="cu-form-group bg-cyan">
			<view class="title  cuIcon-comment">公告：{{notice_title}}</view>
			<button class='cu-btn round lines-white' open-type="getUserInfo" @tap="showMoreNoticeInfo()" :disabled="DISBALE_BUTTON">点击查看详情</button>
		</view>
		<!-- 输入框及生成按钮 -->
		<form>
			<view class="cu-form-group margin-top">
				<view class="title">所在地区</view>
				<picker @change="areaPickerChange" :value="areaPickerIndex" :range="areaPickerList" v-bind:range-key="'areaName'">
					<view class="picker">
						{{areaPickerList[areaPickerIndex].areaName}}
					</view>
				</picker>
			</view>
			<view class="cu-form-group margin-top">
				<view class="title">工号</view>
				<input name="USER_NAME" type="number" v-model="USER_NAME" maxlength="12"></input>
				<button class='cu-btn bg-blue shadow cuIcon-barcode' open-type="getUserInfo" @tap="shareQRCode()" :disabled="DISBALE_BUTTON">展示二维码</button>
				<button class='cu-btn bg-green shadow cuIcon-picfill' open-type="getUserInfo" @tap="downloadImageAndGetBase64AndDrawPoster()"
				 :disabled="DISBALE_BUTTON">生成海报</button>
			</view>

			<!-- <view class="cu-bar bg-white solid-bottom margin-top">
				<view class="action">
					<text class="cuIcon-title text-orange"></text>自动保存海报,海报二维码有问题时打开
				</view>
				<view class="action">
				<switch class='orange radius' @change="autoSavePosterChange" :class="autoSavePoster?'checked':''" :checked="autoSavePoster?true:false"></switch>
				</view>
			</view> -->
		</form>

		<!--海报的绘制组件-->
		<view class="hideCanvasView">
			<canvas canvas-id="CANVAS_ID" class="hideCanvas" style="border: 1px solid; background: #00aaff;" :style="{width: (POSTER_IMAGE_INFO.width||10) + 'px', height: (POSTER_IMAGE_INFO.height||10) + 'px'}"></canvas>
		</view>
		<!--生成二维码或海报后的展示组件 -->
		<view>
			<view class="flex_row_c_c modalView" :class="POSTER_IMAGE_INFO.posterShow?'show':''">
				<view class="flex_column">
					<view class="backgroundColor-white padding1vh border_radius_10px">
						<image v-if='POSTER_IMAGE_INFO.posterUrl' :src="POSTER_IMAGE_INFO.posterUrl || ''" mode="widthFix" class="posterImage"
						 @longtap="saveImage()"></image>
					</view>
					<view class="flex_row marginTop2vh">
						<button type="warn" size="mini" @tap.prevent.stop="hidePoster()">关闭</button>
						<button type="primary" size="mini" @tap.prevent.stop="saveImage()">保存海报</button>
					</view>
				</view>
			</view>
			<view class="flex_row_c_c modalView" :class="QRCODE_Show?'show':''">
				<view class="flex_column">
					<view class="backgroundColor-white padding1vh border_radius_10px">
						<image v-if='QRCODE_Src' :src="QRCODE_Src || ''" mode="widthFix" class="posterImage"></image>
					</view>
					<view class="flex_row marginTop2vh">
						<button type="warn" size="mini" @tap.prevent.stop="hideQrCode()">关闭</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 使用说明 -->
		<view>
			<view class=" text-xl padding">
				<text class="text-black text-bold">使用说明：</text>
			</view>
			<view class=" text-lg padding">
				<text class="text-black">1. 二维码生成步骤：选择地区☞输入"工号"☞点击"生成海报"☞点击"保存海报"即可将海报保存到手机。</text>
			</view>
			<view class=" text-lg padding">
				<text class="text-black">2. 数据统计说明：根据收派员工号统计对应注册量，大区、地区、分点部数据为工号对应注册量之和。</text>
			</view>
			<view class=" text-lg padding">
				<text class="text-red text-bold">3. 生成新的二维码之后，原二维码停止使用，请务必不要再使用。</text>
			</view>
			<view class=" text-lg padding">
				<text class="text-black">4. 长按海报也可保存海报。</text>
			</view>
			<view class=" text-sm padding">
				<text class="text-grey" @tap="updataBasic">点击此处修改生成参数</text>
			</view>
		</view>

		<!-- 密码输入框 -->
		<view>
			<block v-if="isShowConfirm">
				<view class='toast-box'>
					<view class='toastbg'></view>
					<view class='showToast'>
						<view class='toast-title'>
							<text>确认密码</text>
						</view>
						<view class='toast-main'>
							<view class='toast-input'>
								<input type='password' placeholder='输入密码' v-model="passwordUser"></input>
							</view>
						</view>
						<view class='toast-button'>
							<view class='button1'>
								<button @tap='cancelBtn'>取消</button>
							</view>
							<view class='button2'>
								<button @tap="confirmAcceptance">确定</button>
							</view>
						</view>
					</view>
				</view>
			</block>
		</view>
	</view>
</template>

<script>


	// 全局变量
	var _this = this;
	// 数据库名称
	const SQL_DATA_NAME = 'qrcode_basic';
	// 操作的数据库为 qrcode-to-poster-luody
	const db = wx.cloud.database({
		env: 'qrcode-to-poster-luody'
	});
	//微信日志输出
	const wxlog = require('../log.js');

	import {
		getUserInfo,
		downLoadAndSaveFile,
		getQRCodeBase64,
		writeBase64ToFile,
		canvasToImageFile,
		downloadImageAndGetBase64AndDrawPoster
	} from '../../util/js_tools.js'

	export default {
		data() {
			return {
				// 画布的ID
				canvasId: 'default_PosterCanvasId',

				// 显示跳转配置界面的密码输入框是否显示
				isShowConfirm: false,
				// 用户输入的密码
				passwordUser: null,

				// 地区列表
				areaPickerList: [],
				// 用户选择的地区
				areaPickerIndex: 0,

				// 用户工号
				USER_NAME: null,

				// 按钮禁用状态
				DISBALE_BUTTON: false,

				//自动保存海报
				//autoSavePoster:false,

				/**
				 * 海报
				 */


				// 海报信息
				POSTER_IMAGE_INFO: {
					// 海报的宽
					width: 0,
					// 海报的高
					height: 0,
					// 海报云地址
					posterCloudUrl: null,
					// 海报下载地址
					posterImgDownloadUrl: null,
					// 展示海报时的路径
					posterUrl: null,
					// 海报是否展示
					posterShow: false,
				},


				/**
				 * 二维码
				 */
				// 二维码大小
				QRCODE_INFO: {
					// 二维码生成的后台地址
					qrCodeUrl: null,
					// 二维码大小
					qrCodeSize: 0,
					// 二维码X位置
					qrCodeX: 0,
					// 二维码Y位置
					qrCodeY: 0
				},
				// 单纯展示二维码时，图形的路径
				QRCODE_Src: null,
				// 单纯展示二位码的控件是否显示
				QRCODE_Show: false,


				/**
				 * 公告
				 */
				notice_title: null,
				notice_content: null

			}
		},
		// 下拉刷新数据
		onPullDownRefresh() {
			_this.getBasicDataByUserArea();
		},
		mounted() {
			_this = this;
			_this.DISBALE_BUTTON = true;
			uni.showLoading({
				mask: true,
				title: '获取地区数据'
			})
			// 获取所有地区
			db.collection(SQL_DATA_NAME).doc('_MINI_AREA_DATA_ID').get({
				success: function(list_res) {
					wxlog.info(list_res.data._areaData)
					_this.areaPickerList = list_res.data._areaData;
					uni.getStorage({
						key: '_USER_SELECT_AREA',
						success(res) {
							if (res.data == 0) {
								uni.showModal({
									title: '获取用户所在地失败',
									content: '请选择所在地'
								})
								return;
							}
							_this.areaPickerIndex = res.data;
							_this.getBasicDataByUserArea();
						},
						fail(e) {
							uni.showModal({
								title: '获取用户所在地失败',
								content: '请选择所在地'
							})
							// _this.areaPickerIndex=1;
						}
					})
				},
				fail: function(e) {
					wxlog.error('获取下拉地区数据失败：', e);
					uni.showModal({
						content: "请稍后再试：" + JSON.stringify(e),
						title: "获取下拉地区数据失败"
					})
				},
				complete: function() {
					uni.hideLoading();
				}
			});

		},
		methods: {
			showMoreNoticeInfo() {
				uni.showModal({
					showCancel: false,
					title: '公告详情',
					content: _this.notice_content
				})
			},
			/**
			 * 根据用户所在地获取海报生成信息
			 */
			getBasicDataByUserArea() {
				if (_this.areaPickerIndex == 0) {
					uni.showModal({
						title: '获取用户所在地失败',
						content: '请选择所在地'
					})
					_this.DISBALE_BUTTON = true;
					uni.stopPullDownRefresh();
					return;
				}

				db.collection(SQL_DATA_NAME).where({
					//_id:'_MINI_TEST_POSTER_SHARE',
					_areaId: parseInt(_this.areaPickerIndex)
				}).get({
					success: function(res) {
						wxlog.info(res);
						if (res.data.length == 0) {
							uni.showModal({
								title: '获取数据失败',
								content: '获取当前选择地区"' + _this.areaPickerList[_this.areaPickerIndex].areaName + '"的海报生成参数失败',
								showCancel: false
							})
						} else {
							const posterSQL = res.data[0];
							// 使用从数据库中获取到的图片ID换取海报背景的下载地址
							wx.cloud.getTempFileURL({
								fileList: [posterSQL._posterCloudUrl],
								// 有效期设置为20小时
								// maxAge: 120 * 10 * 60 * 1000,
								success: res => {
									wxlog.info('res', res);
									wxlog.info('res.fileList', res.fileList[0].tempFileURL);
									// 下载链接获取完成
									_this.POSTER_IMAGE_INFO.posterImgDownloadUrl = res.fileList[0].tempFileURL;


									// 二维码大小
									_this.QRCODE_INFO.qrCodeSize = posterSQL._qrCodeSize;
									// 二维码X位置
									_this.QRCODE_INFO.qrCodeX = posterSQL._qrCodeX;
									// 二维码Y位置
									_this.QRCODE_INFO.qrCodeY = posterSQL._qrCodeY;
									db.collection(SQL_DATA_NAME).doc('_MINI_POSTER_BASIC_DATA_ID').get({
										success: function(res) {
											wxlog.info('_MINI_POSTER_BASIC_DATA_ID数据：', res.data)
											// 二维码生成的后台地址
											_this.QRCODE_INFO.qrCodeUrl = res.data._qrCodeUrl;
											if (res.data._notice_title == null || res.data._notice_title == 'null' || res.data._notice_title ==
												'' || typeof(res.data._notice_title) == 'undefined') {
												_this.notice_title = '暂无公告';
											} else {
												_this.notice_title = res.data._notice_title;
												_this.notice_content = res.data._notice_content;
											}
										},
										fail: function(e) {
											wxlog.error('获取下拉地区数据失败：', e);
											uni.showModal({
												content: "请稍后再试：" + JSON.stringify(e),
												title: "获取下拉地区数据失败"
											})
										}
									});
									_this.DISBALE_BUTTON = false;
									wxlog.info('_this.POSTER_IMAGE_INFO', _this.POSTER_IMAGE_INFO);
									wxlog.info('_this.QRCODE_INFO', _this.QRCODE_INFO);
								},
								fail: res => {
									wxlog.error('使用从数据库中获取到的图片ID换取下载地址失败：', res);
									uni.showModal({
										content: "获取海报下载地址失败：" + JSON.stringify(res),
										title: "获取基础数据异常"
									})
								}
							})
						}
					},
					fail: function(e) {
						wxlog.error('根据用户所在地获取海报生成信息失败', e)
					},
					complete: function(e) {
						uni.stopPullDownRefresh();
					}
				});
			},
			/**
			 * 地区选择器
			 * @param {Object} e
			 */
			areaPickerChange(e) {
				wxlog.info(e.detail.value)
				_this.areaPickerIndex = e.detail.value;
				wxlog.info(_this.areaPickerList[e.detail.value].areaIndex);
				uni.setStorage({
					key: '_USER_SELECT_AREA',
					data: e.detail.value,
					success: function() {
						wxlog.info('用户所在地保存成功：' + _this.areaPickerIndex + ',' + _this.areaPickerList[e.detail.value]);
						// App.AREA_PICKER_INDEX = _this.areaPickerIndex;
						_this.getBasicDataByUserArea();
					},
					fail(res) {
						uni.showModal({
							title: '保存用户所在地失败',
							content: JSON.stringify(res),
							showCancel: false
						})
					}
				});
			},
			/**
			 * 生成二维码并展示二维码
			 */
			shareQRCode() {
				_this.DISBALE_BUTTON = true;
				getUserInfo().then(function(data) {
						wxlog.info('获取用户信息resolved成功回调：', data);
						getQRCodeBase64(_this.USER_NAME, _this.QRCODE_INFO.qrCodeUrl).then(
								function(res) {
									if (res.data.success == true) {
										_this.QRCODE_Src = res.data.obj.qrCodeBase64;
										_this.QRCODE_Show = true;
									} else {
										uni.showModal({
											content: res.data.errorMessage,
											title: '生成二维码失败',
											showCancel: false
										})
									}
								})
							.catch(function(e) {
								_this.DISBALE_BUTTON = false;
								uni.showModal({
									content: JSON.stringify(e),
									title: '生成二维码失败',
									showCancel: false
								})
							})
					})
					.catch(function(reason, data) {
						_this.DISBALE_BUTTON = false;
						uni.showToast({
							icon: 'none',
							title: '请授权用户信息'
						})
						wxlog.info('获取用户信息rejected失败回调：', reason);
					});
			},

			/**
			 * 下载背景图，获取二维码，绘制海报
			 */
			downloadImageAndGetBase64AndDrawPoster() {

				_this.DISBALE_BUTTON = false;
				getUserInfo().then(function(data) {
						getQRCodeBase64(_this.USER_NAME, _this.QRCODE_INFO.qrCodeUrl).then(function(res) {
								if (res.data.success == true) {
									downloadImageAndGetBase64AndDrawPoster(_this);
								} else {
									uni.showModal({
										content: res.data.errorMessage,
										title: '生成海报失败',
										showCancel: false
									})
								}

							})
							.catch(function(reason, data) {

								_this.DISBALE_BUTTON = false;
								uni.showModal({
									content: reason,
									title: '生成海报失败',
									showCancel: false
								})
								wxlog.info('获取用户信息rejected失败回调：', reason);
							});
					})
					.catch(function(reason, data) {

						_this.DISBALE_BUTTON = false;
						uni.showToast({
							icon: 'none',
							title: '请授权用户信息'
						})
						wxlog.info('获取用户信息rejected失败回调：', reason);
					});
			},

			// 保存海报
			saveImage() {
				uni.saveImageToPhotosAlbum({
					filePath: _this.POSTER_IMAGE_INFO.posterUrl,
					success(res) {
						uni.showToast({
							icon: 'success',
							title: '保存海报成功'
						})
						_this.POSTER_IMAGE_INFO.posterShow = false;
					},
					fail(err) {
						if (err.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || err.errMsg ===
							"saveImageToPhotosAlbum:fail auth deny") {
							uni.showModal({
								title: '保存海报失败',
								content: '请授权小程序保存图片到相册',
								showCancel: false,
								success() {
									wx.getSetting({
										success: (res) => {
											if (!res.authSetting['scope.writePhotosAlbum'])
												wx.openSetting({
													fail(res) {
														uni.showModal({
															title: '打开设置界面失败',
															content: '请手动点击右上角的三个点，再点击＂设置＂，授权小程序保存图片到相册',
															showCancel: false
														})
													}
												})
										}
									})
								}
							})
						} else {
							uni.showModal({
								title: '保存海报失败',
								content: '保存海报失败，请稍后再试：' + err.errMsg,
								showCancel: false
							})
						}
						wxlog.error('工号：' + _this.USER_NAME + '保存海报失败', JSON.stringify(err));
					}
				})
			},
			// 取消显示海报
			hidePoster() {
				_this.DISBALE_BUTTON = false;
				_this.POSTER_IMAGE_INFO.posterShow = false;
			},
			// 隐藏二维码弹窗
			hideQrCode() {
				_this.DISBALE_BUTTON = false;
				_this.QRCODE_Show = false;
				_this.QRCODE_Src = null;
			},
			// 自动保存海报
			/* autoSavePosterChange(e){
				_this.autoSavePoster = e.detail.value;
				wxlog.info('自动保存海报',_this.autoSavePoster);
			}, */

			// 显示跳转配置界面的密码输入框
			updataBasic() {
				_this.isShowConfirm = true;
			},

			// 取消打开配置界面
			cancelBtn: function() {
				_this.isShowConfirm = false;
			},

			// 验证密码并跳转参数配置界面
			confirmAcceptance: function() {
				db.collection(SQL_DATA_NAME).doc('_MINI_POSTER_BASIC_DATA_ID').get({
					success: function(res) {
						const passwordSQL = res.data._editAdminDataPassword;
						if (passwordSQL == _this.passwordUser) {
							_this.isShowConfirm = false;
							wxlog.info('用户输入的密码：[' + _this.passwordUser + ']，后台保存的密码：[' + passwordSQL + ']。验证通过');
							uni.showToast({
								title: '验证成功',
								mask: true
							})
							uni.navigateTo({
								url: '../basic/basic',
								success() {
									_this.passwordUser = null;
								}
							})
						} else {
							wxlog.error('用户输入的密码：[' + _this.passwordUser + ']，后台保存的密码：[' + passwordSQL + ']。验证不通过');
							uni.showToast({
								title: '密码错误',
								icon: 'none',
								success() {
									_this.passwordUser = null;
								}
							})
						}
					},
					fail: function(e) {
						uni.showModal({
							title: '验证失败',
							content: '获取后台密码错误：' + JSON.stringify(e),
							showCancel: false
						})
					}
				})
			}
		},
	}
</script>

<style>
</style>
