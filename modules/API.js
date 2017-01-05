var API = {
	messages: [],
	users: [],

	getActiveUsers: () => this.users,
	getMessageList: () => this.messages, 

	sendMessage: message => chat.sendMessage(message),
	updateMessage: (id, message) => chat.updateMessage(id, message),

	_updateMessages: function(messages) {
		// TODO: Pass new messages to event listeners
		this.messages = this.messages.concat(messages);
	},

	_updateConnectedUsers: function(users) {
		// TODO: Pass user updates to event listeners
		this.users = users;
	}
};
