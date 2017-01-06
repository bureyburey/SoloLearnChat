var cookies = {
	_cookies: {},

	init: function(cookies_string)
	{
		if (cookies_string === '')
			return this._cookies = {};

		var data = cookies_string.split('; ');
		for (var cId = 0; cId < data.length; ++cId)
		{
			var eqIndex = data[cId].indexOf('=');
			this._cookies[data[cId].substring(0, eqIndex)] = JSON.parse(data[cId].substring(eqIndex + 1));
		}
	},

	get: function(name) {
		if (name === undefined) return this._cookies;
		return this._cookies[name];
	},

	set: function(name, value) {
		this._cookies[name] = value;
	},

	save: function() {
		for (var cKey in this._cookies)
			document.cookie = cKey + '=' + JSON.stringify(this._cookies[cKey]);
		console.log(document.cookie);
	}
}
