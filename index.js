// Execute init function on full document load
$(init);

//var FIREBASE_ADDR = "https://sololearnfirebasechat-5bb04.firebaseio.com";

var global_msg;
var msg_location_y;

var MESSAGES_TO_LOAD = 50;

// Create cookies manager
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

// Create time formater module
var strform = {
	repeat: function(obj, count) {
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

	pad: function(obj, filler, padding) {
		var str = obj.toString();
		return this.repeat(filler, padding - str.length) + str;
	}
};

// Create time formater module
var timeformat = {
	formats: {
		project_default: 'HH:MM:SS mm/dd/yyyy',

		default: {
			datetime: 'yyy-mm-dd HH:MM:SS',
			datetime12: 'yyy-mm-dd HH12:MM:SS AMPM',
			date: 'yyy-mm-dd',
			time: 'HH:MM:SS'
		},
	},

	format: function(format, date) {
		var isAlpha = s => s.toLowerCase() != s.toUpperCase();
		var isDigit = s => s.charCodeAt(0) >= 48 && s.charCodeAt(0) <= 57;

		// DATE
		var fullYear = date.getFullYear();
		var year = fullYear % 100;

		var month = date.getMonth() + 1;
		var day = date.getDate();
		var dayOfWeek = date.getDay();

		// TIME
		var hours24 = date.getHours();
		var hours12 = hours24 % 12;

		var minutes = date.getMinutes();
		var seconds = date.getSeconds();

		// SPECIAL
		var ampm = hours24 >= 12 ? 'pm' : 'am';
		var AMPM = hours24 >= 12 ? 'PM' : 'AM';

		var monthNameFull = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
			'Additional month for developers'
		][month - 1];
		var monthName = monthNameFull.substring(0, 3);

		var dayNameFull = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednessday',
			'Thursday',
			'Friday',
			'Saturday'
		][dayOfWeek];
		var dayName = dayNameFull.substring(0, 3);

		var formated = {
			// Special attributes formation
			'ampm' : ampm,
			'AMPM' : AMPM,

			'MNF'  : monthNameFull,
			'MN'   : monthName,
			'DNF'  : dayNameFull,
			'DN'   : dayName,

			// Years formation
			'yyyy' : strform.pad(fullYear, '0', 4),
			'yyy'  : fullYear.toString(),
			'yy'   : strform.pad(year, '0', 2),
			'y'    : year.toString(),

			// Months formation
			'mm'   : strform.pad(month, '0', 2),
			'm'    : month.toString(),

			'dd'   : strform.pad(day, '0', 2),
			'd'    : day.toString(),

			// Time formation
			'HH24' : strform.pad(hours24, '0', 2),
			'HH12' : strform.pad(hours12, '0', 2),
			'HH'   : strform.pad(hours24, '0', 2),

			'H24'  : hours24.toString(),
			'H12'  : hours12.toString(),
			'H'    : hours24.toString(),


			'MM'   : strform.pad(minutes, '0', 2),
			'M'    : minutes.toString(),

			'SS'   : strform.pad(seconds, '0', 2),
			'S'    : seconds.toString()
		};

		var dateString = '';
		var part = '';
		for (var index = 0; index < format.length; ++index)
		{
			if (!isAlpha(format[index]) && !isDigit(format[index]))
			{
				if (formated[part]) dateString += formated[part];
				else dateString += part;

				part = '';
				dateString += format[index];

				continue;
			}

			part += format[index];
		}
		if (formated[part]) dateString += formated[part];
		else dateString += part;

		return dateString;
	}
};

// Create notification manager module
var notificationManager = {};
var initNotificationManager = function() {
	var notify_message = document.getElementById('notify_message');
	var notify_vibrate = document.getElementById('notify_vibrate');

	notificationManager.showNotification = function(message, title) {
		if('vibrate' in window && notify_vibrate.checked)
			navigator.vibrate(1000);
		
		// If the browser does not supports notifications, don not run next code
		if (!('Notification' in window) || !notify_message.checked) return;

		if (title != undefined) toastr.success(message, title);
		
		// Check whether notification permissions have already been granted
		// Otherwise, we need to ask the user for permission
		if (Notification.permission === 'granted') new Notification(message);
		else if (Notification.permission !== 'denied') Notification.requestPermission(function (status) {
			new Notification(message);
		});
	}
};

// Create markdown module
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

// Create page manager module
var pageManager = {};
var initPageManager = function() {
	// Containers
	var containers = {
		'chat_page': document.getElementById('container_chat'),
		'auth_page': document.getElementById('container_login'),

		'remember_me': document.getElementById('checkbox_remember_me'),

		'new_message': document.getElementById('new_message'),
		'message_create_form': document.getElementById('message_create_form'),
		'message_update_form': document.getElementById('message_update_form'),
		'message_list': document.getElementById('message_list'),

		'username': document.getElementById('username'),

		'loader': document.getElementById('loader')
	}
	
	// List of PRIVATE module functions
	var swapVisible = function(containerToShow, containerToHide) {
		containers[containerToShow].style.display = 'block';
		containers[containerToHide].style.display = 'none';
	};

	pageManager._messages_loaded = false;
	
	// List of PUBLIC module functions
	pageManager.showChatPage = function() {
		swapVisible('chat_page','auth_page');
		containers.username.innerHTML = chat.current_user.name;
	};

	pageManager.showAuthPage = () => swapVisible('auth_page', 'chat_page');
	pageManager.showMessageUpdate = () => swapVisible('message_update_form', 'message_create_form');
	pageManager.showMessageCreate = () => swapVisible('message_create_form', 'message_update_form');

	pageManager.clearMessage = () => containers.new_message.value = '';
	pageManager.getMessage = () => containers.new_message.value;
	pageManager.setMessage = text => containers.new_message.value = text;

	pageManager.rememberMe = () => containers.remember_me.checked === true;

	pageManager.showLoader = () => containers.loader.style.display = 'block';
	pageManager.hideLoader = () => containers.loader.style.display = 'none';

	pageManager.updateMessages = function(messages) {
		var formMessage = function(message) {
			var html = '<div class="message_details">';
			html += '<span class="message_author">@{' + message.author + '}</span>';
			
			html += '<span class="user_controls" data-messageId="' + message.id + '">';
			html += '<span class="user_controls" name="edit_message">&#x270F;</span>';
			html += '<span class="user_controls" name="delete_message">&#x1f5d1;</span>';
			html += '</span>';
			
			var formated_time = timeformat.format(timeformat.formats.project_default, new Date(message.createTime));
			html += ' <span class="message_time"></br>at ' + formated_time + '</span></div>';
			html += '<div class="message_body">' + message.body + "</div>";
			html += '<div class="message_actions"><span class="message_reply"></span></div>';

			return html;
		}

		var formMessageFull = message => '<div class="message" id="' + message.id + '">' + formMessage(message) + "</div>";

		var message_list = containers.message_list;

		if (this._messages_loaded)
		{
			for (var msgId in messages) {
				if (messages[msgId].add_mode === 'new')
					message_list.innerHTML = formMessageFull(messages[msgId]) + message_list.innerHTML;
				else if (messages[msgId].add_mode === 'edit')
					document.getElementById(messages[msgId].id).innerHTML = formMessage(messages[msgId]);
			}
		} else {
			for (var msgId in messages)
				message_list.innerHTML = formMessageFull(messages[msgId]) + message_list.innerHTML;
		}

		this._messages_loaded = true;
	}

	pageManager.updateConnectedUsers = function(users) {
		// Sort users by join time
		var users_joined = users.filter(user => API._users.indexOf(user) === -1);

		users.sort((a, b) => a.time - b.time);

		$('#show_connected').text("Connected Users: " + users.length);

		// clean the table except the first row
		var tbl = $("#table_connected_users");
		tbl.find("tr:gt(0)").remove();
		
		for (var i = 0; i < users.length; ++i) {
			var html = "<tr class='user_row'><td class='username'>" + users[i].name + "</td></tr>";
			tbl.append(html);
		}

		if (users.length === 0) return;
		
		for (var userId in users_joined)
			notificationManager.showNotification(users_joined[userId].name + " joined the chat");
	}
};

var chat = {
	_send_message: false,
	_messages_ref: null,

	_message_map: {},

	online_users: [],
	messages: [],
	last_message_time: 0,

	current_user: null,
	
	authUsingCookies: function() {
		var login = cookies.get('login');
		var password = cookies.get('password');

		if (login == undefined || password == undefined) return;

		this.init({
			'name'    : login,
			'password': password
		}, 'login');
	},
	
	init: function(user, mode, listener) {
		if (this.current_user !== null) {
			this.logout();
			return false;
		}

		this.current_user = user;

		// force web sockets to prevent XMLHttpRequest warning    
		firebase.database.INTERNAL.forceWebSockets();
		var db_ref = firebase.database();
		
		var onSuccess = function(user) {
			user.name = chat.current_user.name;
			chat.current_user = user;
			
			db_ref.ref("user_list").child(user.uid).set({
				username: user.name,
				lastOnline: firebase.database.ServerValue.TIMESTAMP
			});
		
			chat._messages_ref = db_ref.ref("chat_messages");
			am_online = firebase.database().ref(".info/connected");
			user_ref = firebase.database().ref('/connected/' + user.name);

			pageManager._messages_loaded = false;

			// create listener when new user is logged in
			am_online.on('value', function(snapshot) {
				if (!snapshot.val()) return;
				
				user_ref.onDisconnect().remove();
				user_ref.set(firebase.database.ServerValue.TIMESTAMP);
			});

			// this will get fired on inital load as well as when ever there is a change in the data
			
			chat._messages_ref.on('child_removed', function(target) {
				// Delete element, using native functions. Works ~6 times faster than jQuery
				var element = document.getElementById(target.key);
				if (element != undefined) element.remove();
			});
			
			chat._messages_ref.orderByChild("createTime").limitToLast(MESSAGES_TO_LOAD).on('value', function(snapshot) {
				pageManager.showLoader();

				var messages = [];
				snapshot.forEach(child => { messages.push({
					id: child.key,
					author: markdown.specToEntities(child.val().author),
					body: markdown.markdownToHtml(child.val().body),
					createTime: child.val().createTime,
					editTime: child.val().editTime
				})});

				var message_ids = chat.messages.map(msg => msg.id);
				var new_messages = messages.filter(msg =>
					(msg.createTime > chat.last_message_time && !chat._message_map.hasOwnProperty(msg.id))
					|| (msg.editTime != msg.createTime && msg.editTime > chat._message_map[msg.id].editTime)
				);

				new_messages.forEach(message => {
					chat._message_map[message.id] = message;
					message.add_mode = message.editTime === message.createTime ? 'new' : 'edit';
				});

				chat._send_message = false;
				if (new_messages.length > 0)
				{
					chat.messages = chat.messages.concat(new_messages);
					chat.last_message_time = chat.messages[chat.messages.length - 1].createTime;
					pageManager.updateMessages(new_messages);
					API._updateMessages(new_messages);
				}

				pageManager.hideLoader();
			});


			db_ref.ref("connected").on("value", function(snapshot) {
				chat.online_users = [];
				snapshot.forEach(child => {chat.online_users.push({
					name: child.key,
					time: child.val()
				})});

				pageManager.updateConnectedUsers(chat.online_users);
				API._updateConnectedUsers(chat.online_users);
			});

			pageManager.showChatPage();
			if (typeof(listener) === 'function') listener(chat.current_user);
		};

		var auth;
		if(mode === 'register')
			auth = firebase.auth().createUserWithEmailAndPassword(user.name + "@nomail.com", user.password);
		else if (mode === 'login')
			auth = firebase.auth().signInWithEmailAndPassword(user.name + "@nomail.com", user.password);
		else return toastr.error('Unknown login mode', 'Error!');

		auth.then(onSuccess).catch(function(error) {
			toastr.error(error.message, 'Error #' + error.code);
			chat.current_user = null;
			if (typeof(listener) === 'function') listener(null);
		});
		return true;
	},
	
	login: function(name, pass, mode, listener) {
		var user = {
			'name'    : name,
			'password': pass
		};
		
		if (user.name.length < 2) {
			toastr.error('Name should contains atleast 2 symbols', 'Error!');
			return;
		}
		
		// set cookie if `remember me` is checked
		if(pageManager.rememberMe()) {
			cookies.set('login', user.name);
			cookies.set('password', user.password);
		} else {
			cookies.delete('login');
			cookies.delete('password');
		}
		
		
		this.init(user, mode, listener);
	},

	logout: function() {
		firebase.auth().signOut().then(function() {
			// Remove all references
			user_ref.remove();

			chat._messages_ref.off();
			am_online.off();
			user_ref.off();

			// Remove user cookies and current user
			cookies.delete('login');
			cookies.delete('password');
			chat.current_user = null;
		});

		pageManager.showAuthPage();
	},

	sendMessage: function(message) {
		this._send_message = true;
		var formed_message = {
			'author'    : chat.current_user.name,
			'user_id'   : chat.current_user.uid,
			'body'      : message,
			'createTime': firebase.database.ServerValue.TIMESTAMP,
			'editTime'  : firebase.database.ServerValue.TIMESTAMP
		};
		this._messages_ref.push(formed_message);
	},

	updateMessage: function(id, body)
	{
		this._messages_ref.child(id).update({
			'body': body,
			'editTime': firebase.database.ServerValue.TIMESTAMP
		});
	}
};

// Create an API module
var API = {
	// Private members
	_messages: [], // List of all messages and edits
	_users: [], // Liste of active users

	_message_updates_listeners: [], // Listeners of message updates
	_user_updates_listeners: [], // Listeners of user updats

	// LogIn modes MODE_REGISTER to create new user, MODE_LOGIN to log into existing account
	MODE_REGISTER: 'register',
	MODE_LOGIN: 'login',

	// Returns list of active users
	getActiveUsers: function() { return this._users; },
	// Returns list of all messages and edits
	getMessageList: function() { return this._messages; },

	// Function to log into chat, listener is function, that takes user.
	// On error listener is executed with NULL
	// On success listener is executed with USER object
	logIn: (user, mode, listener) => chat.login(user.name, user.password, mode, listener),
	// Function to close current chat session
	logOut: () => chat.logout(),

	// Sends message as current user
	sendMessage: message => chat.sendMessage(message),
	// Update content of target message
	// Can edit only messages, that user owns
	//   * Moderators can edit all messages
	updateMessage: (id, message) => chat.updateMessage(id, message),

	_updateMessages: function(new_messages) {
		this._messages = this._messages.concat(new_messages);

		// Call update for each message on each listener
		for (var listenerId = 0; listenerId < this._message_updates_listeners.length; ++listenerId)
			for (var msgId = 0; msgId < new_messages.length; ++msgId)
				this._message_updates_listeners[listenerId](new_messages[msgId]);
	},

	_updateConnectedUsers: function(users) {
		var users_joined = users.filter(user => this._users.indexOf(user) === -1);
		var users_quited = this._users.filter(user => users.indexOf(user) === -1);

		var user_actions = users_joined.map(user => ({ 'name': user.name, 'action': 'join' }));
		user_actions = user_actions.concat(users_quited.map(user => ({ 'name': user.name, 'action': 'exit' })));

		this._users = users;

		for (var listenerId = 0; listenerId < this._user_updates_listeners.length; ++listenerId)
			for (var actId = 0; actId < user_actions.length; ++actId)
				this._user_updates_listeners[listenerId](user_actions[actId]);
	},

	// Functions to add new listeners
	addMessageUpdatesListener: function(listener) {
		if (typeof(listener) !== 'function')
			throw new Error('Listener should have typeof `function`, but `' + typeof(listener) + '` was given');

		this._message_updates_listeners.push(listener);
	},
	
	addUserUpdatesListener: function(listener) {
		if (typeof(listener) !== 'function')
			throw new Error('Listener should have typeof `function`, but `' + typeof(listener) + '` was given');

		this._user_updates_listeners.push(listener);
	}
};

function init() {
	// Initialize all modules
	initPageManager();
	initNotificationManager();
	cookies.init(document.cookie);


	// Configure toastr
	toastr.options = {
		"debug": false,
		"positionClass": "toast-top-left",
		"preventDuplicates": false,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "5000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	}
	
	var tag = document.getElementById("name_tag");
	if (!tag) throw new Error('Detected non-genuine version of the code');
	
	// connected users dialog box
	$('#table_connected_users_container').dialog({
		modal: true,
		autoOpen: false,
		id: 'table_connected_users_container',
		buttons: [{
			text: 'Close',
			class: 'dialog_new',
			click: function() {
				$('#table_connected_users_container').dialog('close');
			}
		}]
	});
	
	$('#about_dialog').dialog({
		modal: true,
		autoOpen: false,
		id: 'about_dialog',
		buttons: [{
			text:'Close',
			class: 'dialog_new',
			click: function() {
				$('#about_dialog').dialog('close');
			}
		}]
	});
	
	// connected users button click handler
	$('#show_connected').click(() => $('#table_connected_users_container').dialog('open'));
	// aboout window click handler
	$('.about').click(() => $('#about_dialog').dialog('open'));

	if (tag.innerHTML != "By Burey")
		throw new Error('Detected non-genuine version of the code');
	
	
	var post = function() {
		if (tag.innerHTML != "By Burey") throw new Error();
		
		var message = pageManager.getMessage().replace(/\s+$/, '');
		if (message.length == 0) {
			toastr.error('Message body cannot be empty', 'Error!');
			return;
		}

		chat.sendMessage(message);
		pageManager.setMessage('');
	}

	var btn_new_user = document.getElementById('btn_new_user');
	var btn_login = document.getElementById('btn_login');
	var btn_logout = document.getElementById('btn_logout');
	var btn_new_post = document.getElementById('btn_new_post');
	
	var btn_update_post = document.getElementById('btn_update_post');
	var btn_update_cancel = document.getElementById('btn_update_cancel');

	btn_new_user.onclick = function() {
		login = document.getElementById('login_name').value.trim();
		password = document.getElementById('login_pass').value.trim();
		chat.login(login, password, 'register');
	}
	
	btn_login.onclick = function() {
		login = document.getElementById('login_name').value.trim();
		password = document.getElementById('login_pass').value.trim();
		chat.login(login, password, 'login');
	}
	
	btn_logout.onclick = chat.logout;
	btn_new_post.onclick = post;
	
	btn_update_post.onclick = function() {
		chat.updateMessage(global_msg.msgId, pageManager.getMessage());
		pageManager.clearMessage();
		pageManager.showMessageCreate();
		window.scrollTo(0, msg_location_y);
	}
	btn_update_cancel.onclick = function() {
		global_msg = null;
		pageManager.clearMessage();
		pageManager.showMessageCreate();
	}
	
	
	$("#show_password").on('click',function(){
		var show_password = $('#show_password').is(':checked');
		$('#login_pass').attr('type', show_password ? 'text' : 'password');
	});
	
	$(".emoji_table").on('click',function() {
		var txt = this.innerHTML;
		var box = document.getElementById('new_message');

		if(txt === 'URL') box.value += '[url:LinkName](http://address)';
		else box.value += txt;
	});
	
	$(document).on('click', ".message_author", function(){
		var author = $.trim($(this).text());
		pageManager.setMessage(pageManager.getMessage() + author);
	});
	
	$(document).on('click','.user_controls', function(event) {
		event.stopImmediatePropagation();
		var id = $(this).parent().attr("data-messageId");
		var name = $(this).attr("name");
		var message_author = $(this).parent().parent().find('.message_author').text();
		var message_body = $(this).parent().parent().parent().find('.message_body').html();

		global_msg = {
			msgId: id,
			author: message_author,
			body: message_body
		};
			
		if(name === 'edit_message') {
			pageManager.showMessageUpdate();
			pageManager.setMessage(markdown.htmlToMarkdown(message_body));
			
			msg_location_y = window.scrollY;
			window.scrollTo(0, 100);
		}
		else if(name === 'delete_message') {
			if(confirm("Delete this message?"))
				chat._messages_ref.child(id).remove();
		}
	});


	// After full configuration try to auth using cookies
	chat.authUsingCookies();
};
