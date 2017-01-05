// Execute init function on full document load
$(init);

//var FIREBASE_ADDR = "https://sololearnfirebasechat-5bb04.firebaseio.com";

var global_msg;

var MESSAGES_TO_LOAD = 50;

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
		if (Notification.permission === "granted") new Notification(message);
		else if (Notification.permission !== 'denied') Notification.requestPermission();
	}
}

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

// Create page manager module
var pageManager = {};
var initPageManager = function() {
	// Containers
	var containers = {
		'chat_page': document.getElementById('container_chat'),
		'auth_page': document.getElementById('container_login'),

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
	
	// List of PUBLIC module functions
	pageManager.showChatPage = function() {
		swapVisible('chat_page','auth_page');
		containers.username.innerHTML = chat.current_user.name;
	};

	pageManager.showAuthPage = () => swapVisible('auth_page', 'chat_page');
	pageManager.showMessageUpdate = () => swap_visible('message_update_form', 'message_create_form');
	pageManager.showMessageCreate = () => swap_visible('message_create_form', 'message_update_form');

	pageManager.clearMessage = () => containers.new_message.innerHTML = '';
	pageManager.getMessage = () => containers.new_message.value;

	pageManager.showLoader = () => containers.loader.style.display = 'block';
	pageManager.hideLoader = () => containers.loader.style.display = 'none';

	pageManager.updateMessages = function(messages) {
		var formMessage = function(message) {
			var html = '<div class="message">';
			html += '<div class="message_details">';
			html += '<span class="message_author">@{' + message.author + '}</span>';
			
			html += '<span class="user_controls" id="' + message.id + '"">';
			html += '<span class="user_controls" name="edit_message">&#x270F;</span>';
			html += '<span class="user_controls" name="delete_message">&#x1f5d1;</span>';
			html += '</span>';
			
			// TODO: Add time formater module from my own project
			html += ' <span class="message_time"></br>at ' + message.time + '</span></div>';
			html += '<div class="message_body">' + message.body + "</div>";
			html += '<div class="message_actions"><span class="message_reply"></span></div></div>';

			return html;
		}

		var message_list = containers.message_list;

		for (var msgId in messages)
			message_list.innerHTML = formMessage(messages[msgId]) + message_list.innerHTML;

		pageManager.hideLoader();
	}

	pageManager.updateConnectedUsers = function(users) {
		// Sort users by join time
		users.sort((a, b) => a.time - b.time);

		$('#show_connected').text("Connected Users: " + users.length);

		// clean the table except the first row
		var tbl = $("#table_connected_users");
		tbl.find("tr:gt(0)").remove();
		
		for (var i = 0; i < users.length; ++i) {
			var html = "<tr class='user_row'><td class='username'>" + users[i].username + "</td></tr>";
			tbl.append(html);
		}
		
		var username = users[users.length - 1].username;
		notificationManager.showNotification(username + " joined the chat");
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
	
	
	init: function(user, mode) {
		chat.current_user = user;

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

			// create listener when new user is logged in
			am_online.on('value', function(snapshot) {
				if (!snapshot.val()) return;
				
				user_ref.onDisconnect().remove();
				user_ref.set(firebase.database.ServerValue.TIMESTAMP);

				// this will get fired on inital load as well as when ever there is a change in the data
				chat._messages_ref.orderByChild("createTime").limitToLast(MESSAGES_TO_LOAD).on('value', function(snapshot) {
					pageManager.showLoader();

					var messages = [];
					snapshot.forEach(child => { messages.push({
						id: child.key,
						author: markdown.specToEntities(child.val().author),
						body: markdown.textToHtml(child.val().body),
						createTime: child.val().createTime,
						editTime: child.val().editTime
					})});

					var message_ids = chat.messages.map(msg => msg.id);
					var new_messages = messages.filter(msg =>
						(msg.createTime > chat.last_message_time
						|| (msg.editTime != msg.createTime && msg.editTime > chat._message_map[msg.id].editTime))
						&& (!chat._send_message || msg.author != chat.current_user.name)
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
				});


				db_ref.ref("connected").on("value", function(snapshot) {
					chat.online_users = [];
					snapshot.forEach(child => chat.online_users.push({
						name: child.key,
						time: child.val()
					}));
					
					pageManager.updateConnectedUsers(chat.online_users);
					API._updateConnectedUsers(chat.online_users);
				});
			});

			pageManager.showChatPage();
		};

		var auth;
		if(mode === 'register')
			auth = firebase.auth().createUserWithEmailAndPassword(user.name + "@nomail.com", user.password);
		else if (mode === 'login')
			auth = firebase.auth().signInWithEmailAndPassword(user.name + "@nomail.com", user.password);
		else return toastr.error('Unknown login mode', 'Error!');

		auth.then(onSuccess).catch(function(error) {
			toastr.error(error.message, 'Error #' + error.code);
		});
	},
	
	login: function(name, pass, mode) {
		var user = {
			name: name,
			password: pass
		};
		
		if (user.name.length < 2) {
			toastr.error('Name should contains atleast 2 symbols', 'Error!');
			return;
		}
		
		this.init(user, mode);
	},

	logout: function() {
		firebase.auth().signOut().then(function() {
			user_ref.remove();

			this._messages_ref.off();
			am_online.off();
			user_ref.off();
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
		console.log(formed_message);
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
API = {
	messages: [],
	users: [],

	getActiveUsers: () => this.users,
	getMessageList: () => this.messages, 

	sendMessage: message => chat.sendMessage(message),
	updateMessage: (id, message) => chat.updateMessage(id, message),

	_updateMessages: function(messages) {
		this.messages = this.messages.concat(messages);
	},

	_updateConnectedUsers: function(users) {
		this.users = users;
	}
};

function init() {
	// Initialize all modules
	initPageManager();
	initNotificationManager();

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
		modal: true, // Dims the page background
		autoOpen: false,
		// height:380,
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
		modal: true, //Not necessary but dims the page background
		autoOpen: false,
		// height:380,
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
		
		var message_input = document.getElementById('new_message');
		var message = message_input.value.replace(/\s+$/, '');
		if (message.length == 0) {
			toastr.error('Message body cannot be empty', 'Error!');
			return;
		}
		
		

		chat.sendMessage(message);
		message_input.value = '';
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
		console.log(this);
		var txt = this.innerHTML;
		var box = document.getElementById('new_message');

		if(txt === 'URL') box.innerHTML += '[url:LinkName](http://address)';
		else box.innerHTML += txt;
	});
	
	
	$(document).on('click','.user_controls',function(event) {
		event.stopImmediatePropagation();
		var id = $(this).parent().attr("id");
		var name = $(this).attr("name");
		var message_author = $(this).parent().parent().find('.message_author').text();
		var message_body = $(this).parent().parent().parent().find('.message_body').text();

		global_msg = {
			msgId: id,
			author: message_author,
			body: message_body
		};
			
		if(name === 'edit_message') {
			pageManager.showMessageUpdate();
			pageManager.clearMessage();
		}
		else if(name === 'delete_message') {
			if(confirm("Delete this message?"))
				this._messages_ref.child(id).remove();
		}
	});
}
