var API = {
	messages: [],
	users: [],

	_message_updates_listeners: [],
	_user_updates_listeners: [],

	getActiveUsers: () => this.users,
	getMessageList: () => this.messages, 

	sendMessage: message => chat.sendMessage(message),
	updateMessage: (id, message) => chat.updateMessage(id, message),

	_updateMessages: function(new_messages) {
		this.messages = this.messages.concat(new_messages);

		// Call update for each message on each listener
		for (var listenerId = 0; listenerId < this._message_updates_listeners.length; ++listenerId)
			for (var msgId = 0; msgId < new_messages.length; ++msgId)
				this._message_updates_listeners[listenerId](new_messages[msgId]);
	},

	_updateConnectedUsers: function(users) {
		var users_joined = users.filter(user => this.users.indexOf(user) === -1);
		var users_quited = this.users.filter(user => users.indexOf(user) === -1);

		var user_actions = users_joined.map(user => ({ 'name': user.name, 'action': 'join' }));
		user_actions = user_actions.concat(users_quited.map(user => ({ 'name': user.name, 'action': 'exit' })));

		this.users = users;

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
