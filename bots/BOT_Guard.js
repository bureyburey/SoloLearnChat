function init(user) {
	if (user === null) {
		toastr.error('Can not start bot!', 'Error');
		return;
	}

	// We are successfully logged in
	// Fill in bad words to start
	BOT_Guard.addWordList([
		'smooh'
	]);

	// Create listeners to check messages
	API.addUserUpdatesListener(BOT_Guard.onUserListUpdate);
	API.addMessageUpdatesListener(BOT_Guard.onMessageRecieve);
}

var BOT_Guard = {
	_users_data: {},
	_filtering_list: [],
	_filters: [],

	addWordList: function(wordList) {
		for (var wId = 0; wId < wordList.length; ++wId)
			BOT_Guard.addWord(wordList[wId]);
	},

	addWord: function(word) {
		BOT_Guard._filtering_list.push(word);
		word = word.replace(/ /g, '');

		var filter = '', sId;
		for (sId = 0; sId < word.length; ++sId)
			filter += word[sId] + '(\\b|[^a-z]*)';
		BOT_Guard._filters.push(new RegExp(filter, 'gi'));

		filter = '';
		for (sId = 0; sId < word.length; ++sId)
			filter += word[sId].toUpperCase() + '[^A-Z]*';
		BOT_Guard._filters.push(new RegExp(filter, 'g'));
	},

	getWordList: function() { return BOT_Guard._filtering_list; },

	_filterMessage: function(message) {
		var filtered_message = message;

		for (var fId in BOT_Guard._filtering_list)
			filtered_message = filtered_message.replace(BOT_Guard._filters[fId], '@!$\\*');

		return filtered_message;
	},
	_capsToLowerRatio: function(message) {
		var capital = 0;
		var lower = 0;

		for (var cId in message) {
			if (/[A-Z]/.test(message[cId])) capital += 1;
			else if (/[a-z]/.test(message[cId])) lower += 1;
		}

		return capital / lower;
	},

	onMessageRecieve: function(message) {
		if (message.author === 'BOT_Guard') return;
		if (!(message.author in BOT_Guard._users_data))
			BOT_Guard._addNewUser(message.author);

		var text = markdown.htmlToMarkdown(message.body);
		console.log(text);
		var filtered_message = BOT_Guard._filterMessage(text);
		var follow_rules = true;
		var user_violations = [];

		// If message contains obscene language - filter it and add 1 foul to user
		if (filtered_message !== text) {
			follow_rules = false;
			BOT_Guard._users_data[message.author].violations.obscene_language += 1;
			user_violations.push('**Obscene language** is not allowed');
		}

		// Check message for CAPS ratio
		var CTL_ratio = BOT_Guard._capsToLowerRatio(text);
		if (CTL_ratio >= 0.7 && message.length > 3) {
			follow_rules = false;
			BOT_Guard._users_data[message.author].violations.caps += 1;
			filtered_message = filtered_message.toLowerCase();
			user_violations.push('**CAPS** is not allowed');
		}

		// Edit message if it fouls the rules, and write about it in chat
		if (!follow_rules)
		{
			API.updateMessage(message.id, filtered_message);
			BOT_Guard._users_data[message.author].reputation -= 1;
			API.sendMessage(
				'**' + message.author + '** do not foul the rules!\n' +
				user_violations.join('\n') + '\n' +
				'Your reputation: ' + BOT_Guard._users_data[message.author].reputation
			);
		}
	},

	_addNewUser: function(user) {
		BOT_Guard._users_data[user] = {
			'name': user,
			'reputation': 0,
			'violations': {
				'caps': 0,
				'obscene_language': 0,
				'spam': 0
			}
		};

		API.sendMessage(
			'Welcome to the chat, **' + user + '**!\n\n' +
			'To use this chat you should follow next rules:\n' +
			'You __**should not**__:\n' +
			'  **1)** Use obscene language\n' +
			'  **2)** Write message using mostly upper case letters\n' +
			'  **3)** Write spam comments\n' +
			'  **4)** Offend other members of the chat\n\n' +
			'We hope you will enjoy using our chat.'
		);
	},

	onUserListUpdate: function() {
		var users = API.getActiveUsers();
		for (var userId in users) {
			if (users[userId].name in BOT_Guard._users_data) continue;
			if (users[userId].name === 'BOT_Guard') continue;

			BOT_Guard._addNewUser(users[userId].name);
		}
	}
};

$(function() {
	API.logIn({
		'name': 'BOT_Guard',
		'password': 'BOT_Guard_%$Ep3I](-BT)'
	}, API.MODE_LOGIN, init);
});
