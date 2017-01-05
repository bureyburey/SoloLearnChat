strform = {
	repeat: function(obj, count)
	{
		if (count <= 0) return '';
		if (count == 1) return obj.toString();

		var result = '';
		var pattern = obj.toString();

		while (count > 1) {
	        if (count % 2 == 1)
	        	result += pattern;

	        count = Math.floor(count / 2);
	        pattern += pattern;
	    }

	    return result + pattern;
	},

	pad: function(obj, filler, padding)
	{
		var str = obj.toString();
		return this.repeat(filler, padding - str.length) + str;
	}
};
