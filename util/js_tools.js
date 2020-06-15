//微信日志输出
const wxlog = require('./log.js');
// 绘制最终展示海报时的错误次数
var canvasToImageFileErrorCount = 1;
// 绘制最终展示海报时的延时
var canvasToImageFileDelayTime = 200;
// 绘制最终展示海报时的画质
var canvasToImageFileQuality = 1;
// 背景图压缩率
var compressImageQuality = 100;
// 获取用户信息
function getUserInfo() {
	let p = new Promise(function(resolve, reject) {
		wx.getSetting({
			success(res) {
				wxlog.info('用户信息：获取用户的当前设置成功', res.authSetting);
				wxlog.info('用户信息：res.authSetting[scope.userInfo]', res.authSetting['scope.userInfo']);
				if (res.authSetting['scope.userInfo'] == false || typeof res.authSetting['scope.userInfo'] == 'undefined') {
					wxlog.info('用户信息：用户未授权过给与小程序用户信息，开始申请权限');
					wx.authorize({
						scope: 'scope.userInfo',
						success(res) {
							wxlog.info("用户信息：向用户申请用户信息成功", res);
							wx.getUserInfo({
								success: function(res) {
									wxlog.info('用户信息：用户已同意授权，获取到用户信息', res);
									var userInfo = res.userInfo
									wxlog.info('用户信息：获取到的用户信息', userInfo);
									resolve('用户信息：用户已同意授权，获取到用户信息');
								},
								fail: function(res) {
									wxlog.info('用户信息：向用户申请用户信息失败', res);
									reject('用户信息：用户已同意授权，但是获取用户信息失败');
								}
							})
						},
						fail: function(res) {
							wxlog.info("用户信息：向用户申请用户信息失败", res);
							reject("用户信息：向用户申请用户信息失败");
						}
					})
				} else {
					wxlog.info('用户信息：用户已经授权过');
					resolve('用户信息：用户已经授权过');
				}
			},
			fail(res) {
				wxlog.error('用户信息：获取用户的当前设置失败', res);
				reject('用户信息：获取用户的当前设置失败');
			}
		})
	})
	return p;
}



/**
 * 下载背景图图片
 * @param {Object} url
 */
function downLoadAndSaveFile(url) {
	wx.getSavedFileList({ // 获取文件列表
		success(res) {
			res.fileList.forEach((val, key) => { // 遍历文件列表里的数据
				wx.removeSavedFile({
					filePath: val.filePath
				});
			})
		}
	})
	return new Promise((rs, rj) => {
		wxlog.info('[downLoadAndSaveFile]准备下载并保存图片', url);
		uni.showLoading({
			mask: true,
			title: '准备下载背景图'
		});
		try {
			if (url.substring(0, 4) === 'http') {
				const downloadTask = uni.downloadFile({
					url,
					success(d_res) {
						wxlog.info('[downLoadAndSaveFile]下载背景图成功', JSON.stringify(d_res));
						uni.showLoading({
							mask: true,
							title: '下载背景图成功'
						});
						if (d_res && d_res.tempFilePath) {
							wxlog.info('[downLoadAndSaveFile]开始压缩背景图');
							uni.compressImage({
								src: d_res.tempFilePath,
								quality: compressImageQuality, // 压缩质量，范围0～100，数值越小，质量越低，压缩率越高（仅对jpg有效）
								success: function(c_res) {
									wxlog.info('[downLoadAndSaveFile]压缩背景图成功', c_res);
									uni.saveFile({
										tempFilePath: c_res.tempFilePath,
										success(s_res) {
											uni.showLoading({
												mask: true,
												title: '保存背景图成功'
											});
											wxlog.info('[downLoadAndSaveFile]保存背景图成功', JSON.stringify(s_res));
											if (s_res && s_res.savedFilePath) {
												rs(s_res.savedFilePath);
											} else {
												rs(c_res.tempFilePath);
											}
										},
										fail(err) {
											wxlog.error('[downLoadAndSaveFile]保存背景图失败', JSON.stringify(err));
											rj('保存背景图失败：' + JSON.stringify(err));
										}
									})
								},
								fail: function(err) {
									wxlog.error('[downLoadAndSaveFile]压缩背景图失败', JSON.stringify(e));
									rj('压缩背景图失败：' + JSON.stringify(err));
								}
							})

						} else {
							wxlog.error('[downLoadAndSaveFile]图片下载完成但是未找到图片的tempFilePath参数', JSON.stringify(d_res));
							rj('图片下载完成但是未找到图片的tempFilePath参数');
						}
					},
					fail(err) {
						wxlog.error('[downLoadAndSaveFile]图片下载异常', JSON.stringify(err));
						rj('图片下载异常：' + JSON.stringify(err));
					}
				})
				downloadTask.onProgressUpdate((res) => {
					uni.showLoading({
						mask: true,
						title: '下载进度' + res.progress + '%'
					})
				});
			} else {
				URL = URL.replace('/pages/index/', '').replace('/pages/basic/', '');
				wxlog.error('[downLoadAndSaveFile]URL前4位非"http"，直接返回URL', URL);
				rs(url);
			}
		} catch (err) {
			rj('图片下载异常：' + JSON.stringify(err));
		}

	})
}

/**
 * 获取Base64二维码信息
 * @param {Object} username
 */
function getQRCodeBase64(username, QRCODE_INFO) {
	wxlog.info('[getQRCodeBase64]传入的用户名为', username);
	return new Promise(async (resolve, reject) => {
		if (username == '' || username == null || username == 'null') {
			reject('请先输入工号');
		}
		uni.request({
			url: QRCODE_INFO,
			method: 'POST',
			data: {
				empCode: username
			},
			success: (res) => {
				wxlog.info('[getQRCodeBase64]返回值', res);
				if ((res.data + '').indexOf('<!DOCTYPE html>') != -1) {
					reject('后台校验返回值异常，请联系管理员');
				}
				if (res.data.success == true) {
					wxlog.info('[getQRCodeBase64]二维码的base64值', res);
					resolve(res);
				} else {
					reject('获取二维码失败：' + res.data.errorMessage)
				}
			},
			fail(e) {
				wxlog.info('[getQRCodeBase64]获取二维码失败', e);
				reject('获取二维码失败：' + JSON.stringify(e));
			}
		});

	})
}

/**
 * 因为canvas在真机上不能绘制base64，所以
 * 将二维码的base64转换成临时文件保存，并返回保存的路径
 * 参考资料：https://developers.weixin.qq.com/community/develop/doc/000a42d2f48700144fc7eed5b52000?highLine=canvas%2520%25E4%25B8%258D%25E7%2594%259F%25E6%2595%2588base64
 * @param {Object} base64
 */
function writeBase64ToFile(base64) {
	return new Promise(async (resolve, reject) => {
		const filePath = `${wx.env.USER_DATA_PATH}/userQRCodeImage.jpeg`;
		// 保存到本地时不需要前缀'data:image/png;base64,'
		base64 = base64.replace('data:image/png;base64,', '');
		//写入文件
		wxlog.info('[writeBase64ToFile]开始将base64写入文件')
		wx.getFileSystemManager().writeFile({
			filePath: filePath,
			data: base64,
			encoding: 'base64',
			success(res) {
				wxlog.info('base64写入文件成功:', res)
				uni.getImageInfo({
					src: filePath,
					success(res) {
						wxlog.info('[writeBase64ToFile]获取写入的base64文件信息成功', res);
						wxlog.info('[writeBase64ToFile]base64文件的路径为', filePath);
						resolve(filePath);
					},
					fail(err) {
						wxlog.error('[writeBase64ToFile]获取写入的base64文件信息失败', err);
						reject(err);
					}
				})
			},
			fail(err) {
				wxlog.error('[writeBase64ToFile]将base64写入文件失败', err);
				reject(err);
			}
		});
	})
}

/**
 * 把当前画布指定区域的内容导出生成指定大小的图片，并返回文件路径，显示在<image>组件上
 * @param {Object} _this
 */

function canvasToImageFile(_this) {
	return new Promise(async (resolve, reject) => {
		setTimeout(() => {
			uni.showToast({
				mask: true,
				icon: 'none',
				title: '第' + canvasToImageFileErrorCount + '次输出绘制'
			});
			//把当前画布指定区域的内容导出生成指定大小的图片，并返回文件路径。在自定义组件下，第二个参数传入自定义组件实例，以操作组件内 <canvas> 组件。
			uni.canvasToTempFilePath({
				x: 0,
				y: 0,
				width: _this.POSTER_IMAGE_INFO.width,
				height: _this.POSTER_IMAGE_INFO.height,
				//destWidth: _this.POSTER_IMAGE_INFO.width * 1, // 理解为放大倍数
				//destHeight: _this.POSTER_IMAGE_INFO.height * 1, // 理解为放大倍数
				canvasId: 'CANVAS_ID',
				fileType: 'jpg',
				quality: canvasToImageFileQuality,
				success: function(res) {
					wxlog.info('[canvasToImageFile]√生成海报成功，尝试次数:' + canvasToImageFileErrorCount + ',延迟:' +
						canvasToImageFileDelayTime + ',画质:' + canvasToImageFileQuality, res);
					wxlog.info('[canvasToImageFile]', res.tempFilePath);
					_this.POSTER_IMAGE_INFO.posterUrl = res.tempFilePath;
					resolve('生成海报成功');
				},
				fail(e) {
					if (canvasToImageFileErrorCount <= 5) {
						// 错误次数+1
						canvasToImageFileErrorCount += 1;
						// 延迟+100
						canvasToImageFileDelayTime += 100;
						// 画质减去0.1
						canvasToImageFileQuality -= 0.1;
						canvasToImageFile(_this);
					} else {
						wxlog.error('[canvasToImageFile]×生成海报失败，尝试次数:' + canvasToImageFileErrorCount + ',延迟:' +
							canvasToImageFileDelayTime + ',画质:' + canvasToImageFileQuality, e);
						reject(JSON.stringify(e));
					}
				}
			}, _this);
		}, canvasToImageFileDelayTime);

	})
}


/**
 * 下载背景图，获取二维码，绘制海报
 * @param {Object} poster_img_url
 * @param {Object} _this
 */
function downloadImageAndGetBase64AndDrawPoster(_this) {
	return new Promise(async (resolve, reject) => {
		const ctx = uni.createCanvasContext('CANVAS_ID');
		_this.DISBALE_BUTTON = true;
		wxlog.info('生成开始');
		uni.showLoading({
			mask: true,
			title: '生成开始'
		});
		try {
			wxlog.info('主进程：【开始】下载背景图');
			const savedFilePath = await downLoadAndSaveFile(_this.POSTER_IMAGE_INFO.posterImgDownloadUrl);
			wxlog.info('主进程：【完成】下载背景图', savedFilePath);
			wxlog.info('主进程：【开始】获取背景图信息');
			uni.getImageInfo({
				src: savedFilePath,
				success: function(image) {
					wxlog.info('主进程：【完成】获取背景图信息', image);
					_this.POSTER_IMAGE_INFO.width = image.width;
					_this.POSTER_IMAGE_INFO.height = image.height;

					// 二维码X
					var temp_qrCodeX = _this.POSTER_IMAGE_INFO.width * _this.QRCODE_INFO.qrCodeX;
					var temp_qrCodeY = _this.POSTER_IMAGE_INFO.height * _this.QRCODE_INFO.qrCodeY;
					//_this.QRCODE_INFO.qrCodeX *= _this.POSTER_IMAGE_INFO.width; // _this.QRCODE_INFO.qrCodeX//RESDATA.serviceDx;
					// 二维码Y
					//_this.QRCODE_INFO.qrCodeY *= _this.POSTER_IMAGE_INFO.height; //* _this.QRCODE_INFO.qrCodeY//RESDATA.serviceDy;
					uni.showLoading({
						mask: true,
						title: '开始绘制海报背景'
					});
					wxlog.info('主进程：【开始】绘制背景图，drawImage');

					ctx.drawImage(
						String(savedFilePath || '') || '',
						0,
						0,
						Number(_this.POSTER_IMAGE_INFO.width || 0) || 100,
						Number(_this.POSTER_IMAGE_INFO.height || 0) || 100);
					ctx.draw(false);
					wxlog.info('主进程：【完成】绘制背景图，drawImage');
					wxlog.info('主进程：【开始】获取二维码');
					getQRCodeBase64(_this.USER_NAME, _this.QRCODE_INFO.qrCodeUrl).then(function(res) {
						uni.showLoading({
							mask: true,
							title: '开始绘制二维码'
						});
						wxlog.info('主进程：【完成】获取二维码', res.data.obj.qrCodeBase64);
						wxlog.info('主进程：【开始】写入base64文件');
						writeBase64ToFile(res.data.obj.qrCodeBase64).then(function(res) {
							wxlog.info('临时文件路径', res);
							wxlog.info('主进程：【完成】写入base64文件');
							wxlog.info('主进程：【开始】绘制base64文件，drawImage');
							wxlog.info(temp_qrCodeX + ',' + temp_qrCodeY + ',' + _this.QRCODE_INFO
								.qrCodeSize + ',' + _this.QRCODE_INFO.qrCodeSize);
							ctx.drawImage(
								String(res || '') || '',
								Number(temp_qrCodeX || 0) || 0,
								Number(temp_qrCodeY || 0) || 0,
								Number(_this.QRCODE_INFO.qrCodeSize || 0) || 100,
								Number(_this.QRCODE_INFO.qrCodeSize || 0) || 100);
							wxlog.info('主进程：【完成】绘制base64文件，drawImage');
							wxlog.info('主进程：【完成】绘制base64文件，drawImage');
							wxlog.info('主进程：【开始】输出绘制');
							/**
							 * @param {Object} cCanvasContext.draw(boolean reserve, function callback)
							 * 将之前在绘图上下文中的描述（路径、变形、样式）画到 canvas 中。
							 * 参数
							 * boolean reserve
							 * 本次绘制是否接着上一次绘制。即 reserve 参数为 false，则在本次调用绘制之前 native 层会先清空画布再继续绘制；若 reserve 参数为 true，则保留当前画布上的内容，本次调用 drawCanvas 绘制的内容覆盖在上面，默认 false。
							 * function callback
							 * 绘制完成后执行的回调函数
							 */
							ctx.draw(true, function(c) {
								wxlog.info('主进程：【完成】输出绘制', c);
								canvasToImageFile(_this).then(function(res) {
									uni.showLoading({
										mask: true,
										title: '输出绘制完成'
									});
									// 展示海报
									wxlog.info('主进程：展示海报');
									_this.POSTER_IMAGE_INFO.posterShow = true;
									_this.DISBALE_BUTTON = false;
									wxlog.info(res);
									uni.hideLoading();
									resolve(true);
								}).catch(function(e) {
									_this.DISBALE_BUTTON = false;
									wxlog.error('主进程：{异常}输出绘制异常', e);
									uni.showModal({
										title: '生成错误',
										content: JSON.stringify(e)
									})
									reject(false);
								})

							});
						}).catch(function(e) {
							_this.DISBALE_BUTTON = false;
							wxlog.error('主进程：{异常}写入base64文件', e);
							uni.hideLoading();
							uni.showModal({
								title: '生成错误',
								content: JSON.stringify(e)
							})
							reject(false);
						})
					}).catch(function(e) {
						_this.DISBALE_BUTTON = false;
						wxlog.error('主进程：{异常}获取二维码', e);
						uni.hideLoading(e);
						uni.showModal({
							title: '生成错误',
							content: JSON.stringify(e)
						})
						reject(false);
					})
				},
				fail(e) {
					_this.DISBALE_BUTTON = false;
					wxlog.error('主进程：{异常}获取背景图信息', e);
					uni.hideLoading(e);
					uni.showModal({
						title: '生成错误',
						content: JSON.stringify(e)
					})
					reject(false);
				}
			})
		} catch (e) {
			_this.DISBALE_BUTTON = false;
			wxlog.error('主进程：{异常}', e);
			uni.hideLoading();
			uni.showModal({
				title: '生成错误',
				content: JSON.stringify(e)
			})
			reject(false);
		}

	})
}
export {
	getUserInfo,
	downLoadAndSaveFile,
	getQRCodeBase64,
	writeBase64ToFile,
	canvasToImageFile,
	downloadImageAndGetBase64AndDrawPoster
}
