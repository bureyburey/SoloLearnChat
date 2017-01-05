var markdown = {
	htmlEntitiesMap: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
		' ': '&nbsp;'
	},
		
	textToHtml: function(text) {
		text = this.specToEntities(text);
		text = text.replace(/\n/g, '<br>');
		
		text = text.replace(
			/([^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
			(_, smb, name, url) => smb + '<a href="' + url + '">' + name + '</a>'
		);
		
		text = text.replace(/([^\\]|^)\*\*(.+?)\*\*/g, (_, smb, content) => smb + '<b>' + content + '</b>');
		text = text.replace(/([^\\]|^)__(.+?)__/g, (_, smb, content) => smb + '<i>' + content + '</i>');
		
		text = text.replace(/\\(.)/g, (_, character) => character);
		
		return text;
	},
	
	specToEntities: function(text) {
		var pattern = new RegExp('/[' + Object.keys(this.htmlEntitiesMap).join('') + ']/', 'g');
		return text.replace(pattern, k => this.htmlEntitiesMap[k]);
	},
	
	entitiesToSpec: function(text) {
		var entToSpecMap = Object.keys(this.htmlEntitiesMap).reduce(function(obj, key){
			obj[data[key]] = key;
			return obj;
		}, {});
		
		var pattern = new RegExp('/[' + Object.keys(entToSpecMap).join('') + ']/', 'g');
		return text.replace(pattern, k => entToSpecMap[k]);
	},
	
	htmlToText: function(html) {
		return html.replace(/<.*?>/g, '');
	}
};
