function textToHtml(text) {
	text = escapeHtml(text);
	text = text.replace(/\n/g, '<br>');
	
	text = text.replace(
		/(?:[^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
		(_, name, url) => ' <a href="' + url + '">' + name + '</a>'
	);
	
	text = text.replace(/(?:[^\\]|^)\*\*([^*]+)\*\*/g, (_, content) => '<b>' + content + '</b>');
	text = text.replace(/(?:[^\\]|^)_([^_]+)_/g, (_, content) => '<i>' + content + '</i>');
	
	text = text.replace(/\\(.)/g, (_, character) => character);
	
	return text;
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
