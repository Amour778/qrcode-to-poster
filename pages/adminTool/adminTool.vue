<template>
	<view>
		<view>
			<!-- 地区 -->
			<view class="cu-bar bg-white solid-bottom">
				<view class="action">
					<text class="cuIcon-title text-orange"></text> 地区
				</view>
			</view>
			<view class="cu-form-group">
				<view class="title">地区名</view>
				<input v-model="aeraNewInput"></input>
				<button class='cu-btn bg-blue shadow cuIcon-add' @tap="addNewAreaBtn"></button>
				<button class='cu-btn bg-orange shadow cuIcon-delete' @tap="deleteAreaBtn"></button>
			</view>
			<view class="cu-form-group">
				<view class="title">已有地区</view>
				<picker @change="areaPickerChange" :value="areaPickerIndex" :range="areaPickerList" v-bind:range-key="'areaName'">
					<view class="picker">
						{{areaPickerList[areaPickerIndex].areaIndex}},{{areaPickerList[areaPickerIndex].areaName}}
					</view>
				</picker>
			</view>
			<!-- 地区 -->

			<!-- 基础数据 -->
			<view class="cu-bar bg-white solid-bottom margin-top">
				<view class="action">
					<text class="cuIcon-title text-orange"></text>小程序基础数据
				</view>
			</view>
			<view class="cu-form-group">
				<view class="title">公告标题</view>
				<input v-model="notice_title"></input>
			</view>
			<view class="cu-form-group align-start">
				<view class="title">公告内容</view>
				<textarea maxlength="-1" :disabled="modalName!=null" v-model="notice_content"></textarea>

			</view>
			<view class="cu-form-group">
				<view class="title">海报配置密码</view>
				<input v-model="editAdminDataPassword"></input>
			</view>
			<!-- <view class="cu-form-group">
				<view class="title">管理员OPENID</view>
				<input v-model="openid"></input>
			</view> -->
			<view class="cu-form-group">
				<view class="title align-start">二维码请求地址</view>
				<textarea maxlength="-1" :disabled="modalName!=null" v-model="qrCodeUrl"></textarea>
			</view>
			<view class="padding flex flex-direction">
				<button @tap="updateAdminData" class="cu-btn bg-green lg margin-top">更新基础数据</button>
			</view>
		</view>
		<!-- 基础数据 -->
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
	export default {
		data() {
			return {
				aeraNewInput: null,
				areaPickerIndex: 0,
				areaPickerList: [{
					areaIndex: 0,
					areaName: '暂无地区'
				}],

				editAdminDataPassword: null, // 管理员打开小程序基础参数界面的密码
				//editBasicDataPassword: null, // 地区管理员打开海报生成界面的密码
				//openid: null, // 创建者ID，op0uR4tenr_26qa43oipVw2C-iPc
				qrCodeUrl: null, // 获取二维码的后台请求地址

				/**
				 * 公告
				 */
				notice_title: null, // 公告标题
				notice_content: null, // 公告内容
			}
		},
		mounted() {
			_this = this;
			// 获取地区数据
			_this.getAreaData();
			// 获取基础数据
			_this.getAdminData();
		},
		onPullDownRefresh() {
			// 获取地区数据
			_this.getAreaData();
			// 获取基础数据
			_this.getAdminData();
			uni.stopPullDownRefresh();
		},
		methods: {
			/**
			 * 获取地区数据
			 */
			getAreaData() {
				uni.showLoading({
					mask: true,
					title: '获取地区数据'
				})
				db.collection(SQL_DATA_NAME).doc('_MINI_AREA_DATA_ID').get({
					success: function(res) {
						// res.data 包含该记录的数据
						wxlog.info(res.data)
						_this.areaPickerList = res.data._areaData;
						uni.hideLoading();
					}
				})
			},
			/**
			 * 获取基础数据
			 */
			getAdminData() {
				uni.showLoading({
					mask: true,
					title: '获取基础数据'
				})
				db.collection(SQL_DATA_NAME).doc('_MINI_POSTER_BASIC_DATA_ID').get({
					success: function(res) {
						// res.data 包含该记录的数据
						wxlog.info(res.data)
						_this.editAdminDataPassword = res.data._editAdminDataPassword;
						//_this.editBasicDataPassword = res.data._editBasicDataPassword;
						//_this.openid = res.data._openid;
						_this.qrCodeUrl = res.data._qrCodeUrl;
						_this.notice_title = res.data._notice_title;
						_this.notice_content = res.data._notice_content;
						uni.hideLoading();
					}
				})
			},
			/**
			 * 地区选择器
			 * @param {Object} e
			 */
			areaPickerChange(e) {
				wxlog.info(e.detail.value)
				_this.areaPickerIndex = e.detail.value;
				wxlog.info(_this.areaPickerList[e.detail.value].areaIndex);
				uni.showToast({
					icon: 'none',
					title: _this.areaPickerList[_this.areaPickerIndex].areaIndex + "," + _this.areaPickerList[_this.areaPickerIndex]
						.areaName
				})
			},
			/**
			 * 添加新的地点
			 * 1.输入新的地点名称
			 * 2.更新数据库中的地址库
			 * 3.重新获取areaPickerList数据
			 */
			addNewAreaBtn(e) {
				if(_this.aeraNewInput==''||_this.aeraNewInput==null||_this.aeraNewInput=='null'){
					uni.showToast({
						icon:'none',title:'请输入地区'
					})
					return;
				}
				var areaCount = _this.areaPickerList[_this.areaPickerList.length-1].areaIndex+1;
				var areaNewArrat = {
					areaIndex: areaCount,
					areaName: _this.aeraNewInput
				};
				_this.areaPickerList = _this.areaPickerList.concat(areaNewArrat);
				wxlog.info('_this.areaPickerList:' + _this.areaPickerList);
				db.collection(SQL_DATA_NAME).doc('_MINI_AREA_DATA_ID').update({
					data: {
						_areaData: _this.areaPickerList
					},
					success: function(res) {
						wxlog.info('添加数据成功:' + res.data);
						_this.getAreaData();
						uni.showToast({
							icon: 'none',
							title: '添加成功'
						})
					}
				})
			},
			//删除当前地区
			deleteAreaBtn(){
				if(_this.areaPickerIndex == 0){
					uni.showToast({
						icon: 'none',
						title: '默认值不可删'
					})
					return;
				}
				wxlog.info('_this.areaPickerList',_this.areaPickerList);
				_this.areaPickerList.splice(_this.areaPickerIndex, 1);
				wxlog.info('_this.areaPickerList',_this.areaPickerList);
				db.collection(SQL_DATA_NAME).doc('_MINI_AREA_DATA_ID').update({
					data: {
						_areaData: _this.areaPickerList
					},
					success: function(res) {
						wxlog.info('删除数据成功:' + res.data);
						_this.getAreaData();
						uni.showToast({
							icon: 'none',
							title: '删除成功'
						})
						_this.areaPickerIndex=0;
					}
				})
			},

			/**
			 * 更新基础数据
			 */
			updateAdminData() {
				db.collection(SQL_DATA_NAME).doc('_MINI_POSTER_BASIC_DATA_ID').update({
					data: {
						//创建者ID，op0uR4tenr_26qa43oipVw2C-iPc
						//_openid: _this.openid,
						//管理员打开小程序基础参数界面的密码
						//_editBasicDataPassword: _this.editBasicDataPassword,
						//地区管理员打开海报生成界面的密码
						_editAdminDataPassword: _this.editAdminDataPassword,
						//获取二维码的后台请求地址
						_qrCodeUrl: _this.qrCodeUrl,
						// 公告标题
						_notice_title: _this.notice_title,
						// 公告内容
						_notice_content: _this.notice_content,

					},
					success: function(res) {
						wxlog.info('res', res)
						if (res.errMsg == 'doc.update:ok' || res.errMsg == 'document.update:ok') {
							if (res.stats.updated == 0) {
								uni.showToast({
									title: '没有数据被更新',
									icon: 'none'
								})
							} else {
								_this.getAdminData();
								uni.showToast({
									title: '更新成功'
								})
							}

						} else {
							uni.showModal({
								content: JSON.stringify(res),
								title: '更新失败',
								showCancel: false
							})
						}

					}
				})
			}
			/**
			 * 
			 */



		}
	}
</script>

<style>

</style>
