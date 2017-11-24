var createProxy = (callback) => {
	var categoryName, methodName
	var query = this.query
	var method = new Proxy({}, {
		get: (target, name) => {
			methodName = name
			return (...args) => {
				callback(`${categoryName}.${methodName}`, args)
			}
		}
	})

	var category = new Proxy({}, {
		get: (target, name) => {
			categoryName = name
			return method
		}
	})		

	return category
}

module.exports = createProxy