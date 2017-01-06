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
				document.getElementById(target.key).remove();
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
					(msg.createTime > chat.last_message_time
					|| (msg.editTime != msg.createTime && msg.editTime > chat._message_map[msg.id].editTime))
					&& (!chat._send_message || msg.author != markdown.specToEntities(chat.current_user.name))
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
