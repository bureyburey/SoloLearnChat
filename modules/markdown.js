var markdown = {
	htmlEntitiesMap: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
		' ': '&nbsp;'
	},
		
	markdownToHtml: function(markdown) {
		var html = this.specToEntities(markdown);
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
		var entToSpecMap = Object.keys(this.htmlEntitiesMap).reduce(function(obj, key, data) {
			obj[data[key]] = key;
			return obj;
		}, {});
		
		var pattern = new RegExp('[' + Object.keys(entToSpecMap).join('') + ']', 'g');
		return text.replace(pattern, k => entToSpecMap[k]);
	},
	
	htmlToText: html => html.replace(/<\/?[a-z]+.*?>/g, ''),

	htmlToMarkdown: function(html)
	{
		var markdown = this.entitiesToSpec(html);

		markdown = markdown.replace(/\\/g, '\\\\');
		markdown = markdown.replace(/\*\*/g, '\\**');
		markdown = markdown.replace(/\_\_/g, '\\__');
		markdown = markdown.replace(/\[[^:\]]+:[^\]]+\](.*?)/g, data => '\\' + data);

		// Simple convertion
		markdown = html.replace(/<br>/g, '\n');
		markdown = markdown.replace(/<b>(.*?)<\/b>/g, (_, content) => '**' + content + '**');
		markdown = markdown.replace(/<i>(.*?)<\/i>/g, (_, content) => '__' + content + '__');

		// Convertion of special objects
		markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, (_, link, name) => '[url:' + name + '](' + link + ')');

		return markdown;
	}
};
