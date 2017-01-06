var cookies = {
	_cookies: {},

	init: function(cookies_string)
	{
		this._cookies = {};
		if (cookies_string === '') return;

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

	set: function(name, value, expires_days) {
		var expires = '';

		if (typeof expires_days === 'number' && Number.isFinite(expires_days))  {
			var date = new Date();
			date.setTime(date.getTime() + (expires_days * 24 * 60 * 60 * 1000));
			expires = '; expires=' + date.toGMTString();
		}

		this._cookies[name] = value;
		document.cookie = name + '=' + JSON.stringify(this._cookies[name]) + expires + '; path=/';
		if (expires_days <= 0) delete this._cookies[name];
	},

	delete: function(name) {
		this.set(name, '', -10);
	}
};
