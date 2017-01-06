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
