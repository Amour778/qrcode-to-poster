var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

module.exports = {
	info() {
		if (!log) {
			return
		}
		console.log(arguments)
		log.info.apply(log, arguments)
	},
	warn() {
		if (!log) {
			return
		}
		console.warn(arguments)
		log.warn.apply(log, arguments)
	},
	error() {
		if (!log) {
			return
		}
		console.error(arguments)
		log.error.apply(log, arguments)
	},
	setFilterMsg(msg) { // 从基础库2.7.3开始支持
		if (!log || !log.setFilterMsg) {
			return
		}
		if (typeof msg !== 'string') {
			return
		}
		log.setFilterMsg(msg)
	}
}
