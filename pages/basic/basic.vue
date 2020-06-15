<template>
	<view>
		<!-- 二维码位置参数 -->
		<view>
			<view class="cu-bar margin-top bg-white">
				<view class="action">
					<text class="cuIcon-title text-blue"></text>二维码位置参数
				</view>
			</view>
			<form>
				<!-- <text>当前海报图的分辨率为：高{{POSTER_IMAGE_INFO.height}},宽{{POSTER_IMAGE_INFO.width}}</text> -->
				<view class="cu-form-group">
					<view class="title">所在地区</view>
					<picker @change="areaPickerChange" :value="areaPickerIndex" :range="areaPickerList" v-bind:range-key="'areaName'">
						<view class="picker">
							{{areaPickerList[areaPickerIndex].areaName}}
						</view>
					</picker>
				</view>
				<view class="cu-form-group">
					<view class="title">在X轴的位置</view>
					<input placeholder="数据从0到1" type="digit" name="qrCodeX" v-model="QRCODE_INFO.qrCodeX"></input>
					<view class="cu-tag line-blue">
						数值越大越靠右
					</view>
				</view>
				<view class="cu-form-group">
					<view class="title">在Y轴的位置</view>
					<input placeholder="数据从0到1" type="digit" name="qrCodeY" v-model="QRCODE_INFO.qrCodeY"></input>
					<view class="cu-tag line-blue">
						数值越大越靠下
					</view>
				</view>
				<view class="cu-form-group">
					<view class="title">二维码大小</view>
					<input placeholder="0" type="number" name="qrCodeSize" v-model="QRCODE_INFO.qrCodeSize"></input>
					<view class="cu-tag line-blue">
						数值越大二维码越大
					</view>
				</view>
				<!-- <view class="cu-form-group padding flex flex-direction">
					<button class="cu-btn bg-blue lg">更新二维码位置参数</button>
				</view> -->
				<view class="cu-form-group padding">
					<button class="cu-btn bg-cyan  cuIcon-upload shadow" @tap="uploadFileToCloud" :disabled="DISBALE_BUTTON">上传新的海报</button>
					<button class="cu-btn bg-cyan shadow cuIcon-picfill" @tap="downloadImageAndGetBase64AndDrawPoster" :disabled="DISBALE_BUTTON">预览生成效果</button>
				</view>
			</form>

		</view>

		<!-- 相关说明 -->
		<view>
			<view class="cu-bar margin-top bg-white">
				<view class='action'>
					<text class='cuIcon-title text-blue'></text>相关说明
				</view>
			</view>
			<view class="padding bg-white">
				<view>1.点击
					<button class="cu-btn bg-green round shadow cuIcon-check" @tap="updateBasicSQL" :disabled="DISBALE_BUTTON">提交最终数据</button>
					来更新用户端海报的生成方式。
				</view>
				<view>2.点击<button class="cu-btn round line-purple margin-top " @tap="showBASICt_DATA">二维码位置数据参考图</button>来查看二维码在海报各个位置的参数。
					但是二维码的位置也会因为海报的大小、形状，以及二维码缩放程度的不同，而导致位置参数的不同。故此处的数据只能做参考。
				</view>
			</view>
		</view>

		<!-- 其他数据 -->
		<view>
			<!-- 数据模板 -->
			<view class="flex_row_c_c modalView" :class="BASICt_DATA?'show':''">
				<view class="flex_column">
					<view class="backgroundColor-white padding1vh border_radius_10px">
						<image src="cloud://qrcode-to-poster-luody.7172-qrcode-to-poster-luody-1301853898/基础信息/基础位置信息2.PNG" mode="widthFix"
						 class="posterImage"></image>
					</view>
					<view class="flex_row marginTop2vh">
						<button type="default" size="mini" @tap.prevent.stop="hideBASICt_DATA()">关闭</button>
					</view>
				</view>
			</view>


			<!--当前海报背景图的展示组件-->
			<view class="padding bg-white" style="width: 100%">
				<image v-if="POSTER_IMAGE_INFO.posterImgDownloadUrl" :src="POSTER_IMAGE_INFO.posterImgDownloadUrl"></image>
			</view>
			<!--海报的绘制组件-->
			<view class="hideCanvasView">
				<canvas canvas-id="CANVAS_ID" class="hideCanvas" s style="border: 1px solid; background: #00aaff;" :style="{width: (POSTER_IMAGE_INFO.width||10) + 'px', height: (POSTER_IMAGE_INFO.height||10) + 'px'}"></canvas>
			</view>
			<!--生成海报后的展示组件 -->
			<view>
				<view class="flex_row_c_c modalView" :class="POSTER_IMAGE_INFO.posterShow?'show':''">
					<view class="flex_column">
						<view class="backgroundColor-white padding1vh border_radius_10px">
							<image :src="POSTER_IMAGE_INFO.posterUrl || ''" mode="widthFix" class="posterImage" @longtap="saveImage()"></image>
						</view>
						<view class="flex_row marginTop2vh">
							<button type="warn" size="mini" @tap.prevent.stop="hidePoster()">关闭</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 用户代码 -->
		<view class=" text-sm padding">
			<button class="cu-btn text-grey cuIcon-copy" @tap="copyUserOpenId">复制用户OPENID到剪切板</button>
			<button class='cu-btn text-grey' @tap="updateAdminData">超级管理员</button>
		</view>
	</view>
</template>

<script>
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
	// 全局变量
	var _this = this,
		adminUserOpenId = null;
	// 数据库名称
	const SQL_DATA_NAME = 'qrcode_basic';
	// 操作的数据库为 qrcode-to-poster-luody
	const db = wx.cloud.database({
		env: 'qrcode-to-poster-luody'
	});
	//当前用户选择的所在地的数据ID
	var NowUserAreaDataToSQLId;

	export default {
		data() {
			return {
				// 画布的ID
				canvasId: 'default_PosterCanvasId',
				// 地区列表
				areaPickerList: [],
				// 用户选择的地区
				areaPickerIndex: 0,
				//基础位置信息
				BASICt_DATA: false,

				// 用户工号
				USER_NAME: '01059101',

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
					// 海报下载地址
					posterImgDownloadUrl: null,
					// 展示海报时的路径
					posterUrl: null,
					// 海报云路径
					posterCloudUrl: null,
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

			}
		},
		// 下拉刷新数据
		onPullDownRefresh() {
			_this.getBasicDataByUserArea();
		},
		// 每次mounted都获取基础数据
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
			/**
			 * 复制用户openid
			 */
			copyUserOpenId() {
				uni.showLoading({
					title: '获取中',
					mask: true
				})
				wx.cloud.callFunction({
					name: 'getUserInfoJs',
					success: res => {
						uni.setClipboardData({
							data: res.result.openid,
							success: function() {
								wxlog.info('复制成功');
							}
						});
					},
					fail: res => {
						uni.showModal({
							content: JSON.stringify(res),
							title: '获取OPENID失败',
							showCancel: false
						})
					},
					complete: res => {
						uni.hideLoading()
					},
				});
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
							NowUserAreaDataToSQLId = null;
							_this.POSTER_IMAGE_INFO = {
								// 海报的宽
								width: 0,
								// 海报的高
								height: 0,
								// 海报下载地址
								posterImgDownloadUrl: null,
								// 展示海报时的路径
								posterUrl: null,
								// 海报云路径
								posterCloudUrl: null,
								// 海报是否展示
								posterShow: false,
							};
							_this.QRCODE_INFO = {
								// 二维码生成的后台地址
								qrCodeUrl: null,
								// 二维码大小
								qrCodeSize: 0,
								// 二维码X位置
								qrCodeX: 0,
								// 二维码Y位置
								qrCodeY: 0
							};
							_this.DISBALE_BUTTON = false;

						} else {
							const posterSQL = res.data[0];
							NowUserAreaDataToSQLId = posterSQL._id;
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
								},
								fail: res => {
									_this.DISBALE_BUTTON = true;
									wxlog.error('使用从数据库中获取到的图片ID换取下载地址失败：', res);
									uni.showModal({
										content: "获取海报下载地址失败：" + JSON.stringify(res),
										title: "获取基础数据异常"
									})
								}
							})
							// 海报云地址
							_this.POSTER_IMAGE_INFO.posterCloudUrl = posterSQL._posterCloudUrl;
							// 二维码大小
							_this.QRCODE_INFO.qrCodeSize = posterSQL._qrCodeSize;
							// 二维码X位置
							_this.QRCODE_INFO.qrCodeX = posterSQL._qrCodeX;
							// 二维码Y位置
							_this.QRCODE_INFO.qrCodeY = posterSQL._qrCodeY;
						}
					},
					fail: function(e) {
						_this.DISBALE_BUTTON = true;
						uni.showModal({
							content: "根据用户所在地获取海报生成信息失败：" + JSON.stringify(res),
							title: "获取基础数据异常"
						})
						wxlog.error('根据用户所在地获取海报生成信息失败', e)
					},
					complete: function(res) {
						_this.getMainBasicData();
						uni.stopPullDownRefresh();
					}
				});
			},
			getMainBasicData() {
				db.collection(SQL_DATA_NAME).doc('_MINI_POSTER_BASIC_DATA_ID').get({
					success: function(res) {
						wxlog.info('_MINI_POSTER_BASIC_DATA_ID数据：', res.data)
						// 管理员的openid
						adminUserOpenId = res.data._openid;
						// 二维码生成的后台地址
						_this.QRCODE_INFO.qrCodeUrl = res.data._qrCodeUrl;
						_this.DISBALE_BUTTON = false;
						wxlog.info('_this.POSTER_IMAGE_INFO', _this.POSTER_IMAGE_INFO);
						wxlog.info('_this.QRCODE_INFO', _this.QRCODE_INFO);
					},
					fail: function(e) {
						_this.DISBALE_BUTTON = true;
						wxlog.error('获取下拉地区数据失败：', e);
						uni.showModal({
							content: "请稍后再试：" + JSON.stringify(e),
							title: "获取下拉地区数据失败"
						})
					},
					complete: function() {
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
			 * 下载背景图，获取二维码，绘制海报
			 */
			downloadImageAndGetBase64AndDrawPoster() {
				getUserInfo().then(function(data) {
						getQRCodeBase64(_this.USER_NAME, _this.QRCODE_INFO.qrCodeUrl).then(function(res) {
								if (res.data.success == true) {
									try {
										downloadImageAndGetBase64AndDrawPoster(_this);
									} catch (e) {
										uni.showModal({
											content: JSON.stringify(e),
											title: '生成海报失败',
											showCancel: false
										})
									}

								} else {
									uni.showModal({
										content: JSON.stringify(res.data.errorMessage),
										title: '生成海报失败',
										showCancel: false
									})
								}

							})
							.catch(function(reason, data) {
								uni.showModal({
									content: JSON.stringify(reason),
									title: '生成海报失败',
									showCancel: false
								})
								wxlog.info('获取用户信息rejected失败回调：', reason);
							});
					})
					.catch(function(reason, data) {
						wxlog.info('获取用户信息rejected失败回调：', reason);
					});
			},

			// 上传图片
			uploadFileToCloud: function() {
				wx.chooseImage({
					count: 1,
					sizeType: ['original'],
					sourceType: ['album'],
					success: res => {
						// tempFilePath可以作为img标签的src属性显示图片
						const tempFilePaths = res.tempFilePaths;
						uni.showLoading({
							title: '提交中'
						});

						const promiseArr = [];
						_this.fileIDs = [];
						// 只能一张张上传 遍历临时的图片数组
						for (let i = 0; i < tempFilePaths.length; i++) {
							let filePath = tempFilePaths[i]
							// 正则表达式，获取文件扩展名
							let suffix = /\.[^\.]+$/.exec(filePath)[0];
							// 在每次上传的时候，就往promiseArr里存一个promise，只有当所有的都返回结果时，才可以继续往下执行
							promiseArr.push(new Promise((reslove, reject) => {
								wx.cloud.uploadFile({
									cloudPath: new Date().getTime() + suffix,
									// 文件路径
									filePath: filePath,
								}).then(res => {
									// 获取上传后返回的文件ID
									wxlog.info(res.fileID);
									_this.fileIDs.push(res.fileID);
									wxlog.info('获取上传后返回的文件ID', res);
									reslove();
								}).catch(error => {
									wxlog.info(error);
								})
							}))
						}
						Promise.all(promiseArr).then(res => {
							wxlog.info(res);
							wxlog.info('_this.fileIDs', _this.fileIDs);

							_this.POSTER_IMAGE_INFO.posterCloudUrl = _this.fileIDs[0];
							wxlog.info('上传后返回的图片ID：' + _this.POSTER_IMAGE_INFO.posterCloudUrl);
							wx.cloud.getTempFileURL({
								fileList: [_this.POSTER_IMAGE_INFO.posterCloudUrl],
								// 有效期设置为20小时
								maxAge: 120 * 10 * 60 * 1000,
								success: res => {
									_this.POSTER_IMAGE_INFO.posterImgDownloadUrl = res.fileList[0].tempFileURL;
									wxlog.info('转换成下载链接', TempFileURL);
								},
								fail: wxlog.error
							})
						});
						uni.hideLoading();
					}
				})
			},
			// 取消显示海报
			hidePoster() {
				_this.POSTER_IMAGE_INFO.posterShow = false;
			},
			// 显示基础数据模板
			showBASICt_DATA() {
				_this.BASICt_DATA = true;
			},
			// 隐藏基础数据模板
			hideBASICt_DATA() {
				_this.BASICt_DATA = false;
			},
			// 更新基础数据
			updateBasicSQL() {
				uni.showModal({
					content: '确定提交当前的生成数据吗',
					title: '注意！',
					success: function(res) {
						if (res.confirm) {
							wxlog.info('开始提交数据到数据库：' + SQL_DATA_NAME + '，ID为：' + NowUserAreaDataToSQLId + '的数据', _this.POSTER_IMAGE_INFO);
							if (String(NowUserAreaDataToSQLId) == '' || String(NowUserAreaDataToSQLId) == 'null') {
								uni.showModal({
									content: '未获取到该地区原有海报生成数据的唯一性ID标志。是要添加该地区的海报生成数据吗?如果不是添加新数据，只是修改海报生成数据，请取消后，下拉刷新界面后再尝试更新',
									title: '☢注意☢',
									success: function(res) {
										if (res.confirm) {
											uni.showLoading({
												mask: true,
												title: '提交中'
											})
											_this.addPosterData();

										}
									}
								})
							} else {
								uni.showLoading({
									mask: true,
									title: '提交中'
								})
								_this.updatePosterData();
							}

						}
					}
				})
			},
			// 更新海报数据
			updatePosterData() {
				db.collection(SQL_DATA_NAME).doc(NowUserAreaDataToSQLId).update({
					data: {
						// 海报云地址
						_posterCloudUrl: _this.POSTER_IMAGE_INFO.posterCloudUrl,
						// 二维码大小
						_qrCodeSize: _this.QRCODE_INFO.qrCodeSize,
						// X
						_qrCodeX: _this.QRCODE_INFO.qrCodeX,
						// Y
						_qrCodeY: _this.QRCODE_INFO.qrCodeY,

					},
					success: function(res) {
						wxlog.info('res', res)
						if (res.errMsg == 'doc.update:ok' || res.errMsg == 'document.update:ok') {
							if (res.stats.updated == 0) {
								uni.hideLoading();
								uni.showToast({
									title: '没有数据被更新',
									icon: 'none'
								})
								wxlog.info('没有数据被更新');
							} else {
								wxlog.info('更新成功');
								_this.getBasicDataByUserArea();
								uni.showToast({
									title: '更新成功'
								})
							}

						} else {
							wxlog.error('更新失败');
							uni.hideLoading();
							uni.showModal({
								content: JSON.stringify(res),
								title: '更新失败',
								showCancel: false
							})
						}

					}
				})
			},


			// 添加海报数据
			addPosterData() {
				db.collection(SQL_DATA_NAME).add({
					// data 字段表示需新增的 JSON 数据
					data: {
						// _openid: res.result.openid,
						_areaId: Number(_this.areaPickerIndex || 0),
						_posterCloudUrl: String(_this.POSTER_IMAGE_INFO.posterCloudUrl || null),
						_qrCodeSize: Number(_this.QRCODE_INFO.qrCodeSize || 0),
						_qrCodeX: Number(_this.QRCODE_INFO.qrCodeX || 0),
						_qrCodeY: Number(_this.QRCODE_INFO.qrCodeY || 0)
					},
					success: function(res) {
						wxlog.info('添加成功，返回ID为：', res);
						_this.getBasicDataByUserArea();
						uni.showToast({
							title: '添加数据成功'
						})
					},
					fail: function(e) {
						wxlog.error('添加数据失败', e)
						uni.showModal({
							content: +JSON.stringify(e),
							title: '添加数据失败',
							showCancel: false
						})
					},
					complete: function(res) {
						uni.hideLoading()
					}
				})
			},
			// 跳转到超级管理员界面
			updateAdminData() {
				// 校验用户的openid
				wx.cloud.callFunction({
					name: 'getUserInfoJs',
					complete: res => {
						if (String(res.result.openid) == String(adminUserOpenId)) {
							uni.navigateTo({
								url: '../adminTool/adminTool'
							})
						} else {
							uni.showToast({
								icon: 'none',
								title: '权限不足'
							})
						}
					}
				});
			}
		}
	}
</script>

<style>

</style>
