var markdown = {
	htmlEntitiesMap: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
		' ': '&nbsp;'
	},
		
	markdownToHtml: function(markdownText) {
		var html = this.specToEntities(markdownText);
		html = html.replace(/\n/g, '<br>');
		
		html = html.replace(
			/([^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
			(_, smb, name, url) => smb + '<a href="' + url + '">' + name + '</a>'
		);
		
		html = html.replace(/([^\\]|^)\*\*(.+?)\*\*/g, (_, smb, content) => smb + '<b>' + content + '</b>');
		html = html.replace(/([^\\]|^)__(.+?)__/g, (_, smb, content) => smb + '<i>' + content + '</i>');
		
		html = html.replace(/\\(.)/g, (_, character) => character);
		
		return html;
	},
	
	specToEntities: function(text) {
		var pattern = new RegExp('[' + Object.keys(this.htmlEntitiesMap).join('') + ']', 'g');
		return text.replace(pattern, k => this.htmlEntitiesMap[k]);
	},
	
	entitiesToSpec: function(text) {
		var entToSpecMap = Object.keys(this.htmlEntitiesMap).reduce(function(obj, key) {
			obj[markdown.htmlEntitiesMap[key]] = key;
			return obj;
		}, {});
		
		var pattern = new RegExp(Object.keys(entToSpecMap).join('|'), 'g');
		return text.replace(pattern, k => entToSpecMap[k]);
	},
	
	htmlToText: html => html.replace(/<\/?[a-z]+.*?>/g, ''),

	htmlToMarkdown: function(html)
	{
		var mdText = this.entitiesToSpec(html);

		mdText = mdText.replace(/\\/g, '\\\\');
		mdText = mdText.replace(/\*\*/g, '\\**');
		mdText = mdText.replace(/\_\_/g, '\\__');
		mdText = mdText.replace(/\[[^:\]]+:[^\]]+\](.*?)/g, data => '\\' + data);

		// Simple convertion
		mdText = mdText.replace(/<br>/g, '\n');
		mdText = mdText.replace(/<b>(.*?)<\/b>/g, (_, content) => '**' + content + '**');
		mdText = mdText.replace(/<i>(.*?)<\/i>/g, (_, content) => '__' + content + '__');

		// Convertion of special objects
		mdText = mdText.replace(/<a href="(.*?)">(.*?)<\/a>/g, (_, link, name) => '[url:' + name + '](' + link + ')');

		return mdText;
	}
};
