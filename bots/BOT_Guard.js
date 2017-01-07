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
			else if (/[a-z!@$]/.test(message[cId])) lower += 1;
		}

		return capital / lower;
	},

	onMessageRecieve: function(message) {
		if (message.author === 'BOT_Guard') return;
		if (!(message.author in BOT_Guard._users_data))
			BOT_Guard._addNewUser(message.author);

		var text = markdown.htmlToMarkdown(message.body);
		
		var follow_rules = true;
		var user_violations = [];

		// If message contains obscene language - filter it and add 1 foul to user
		var filtered_message = BOT_Guard._filterMessage(text);
		if (filtered_message !== text) {
			follow_rules = false;
			BOT_Guard._users_data[message.author].violations.obscene_language += 1;
			user_violations.push('**Obscene language** is not allowed');
		}

		// Check message for CAPS ratio
		var CTL_ratio = BOT_Guard._capsToLowerRatio(text);
		if (CTL_ratio >= 0.7 && text.length > 3) {
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
				'@{' + message.author + '} do not foul the rules!\n' +
				user_violations.join('\n') + '\n' +
				'Your reputation: **__' + BOT_Guard._users_data[message.author].reputation + '__**'
			);

			return;
		}

		// If all good check if user is requested information or wants to update the bot
		if (/@{BOT_Guard}/.test(text)) {
			var queries = text.split('\n').splice(1);
			var query_results = [];

			var expressions = {
				'select': /^select ((?:[a-z.]+(?: *, *[a-z.]+)*)|\*) from ([a-z_]+)$/gi,
				'select_where': /^select ((?:[a-z.]+(?: *, *[a-z.]+)*)|\*) from ([a-z_]+) where (.+)$/gi,
				'add': /^add "((?:[^"]|\")*)" to ([a-z_]+)$/gi,
				'delete': /^delete "((?:[^"]|\\")*)" from ([a-z_]+)$/gi,
				'report': /^report @{([^}]+)} for (.+)$/gi,
			};

			queries.forEach(query => {
				query = query.trim();
				var data;
				var result = BOT_Guard._qError('Wrong query structure');

				if ((data = expressions.select.exec(query)))
					result = BOT_Guard._qSelect(data[2], data[1].replace(/ /g, '').split(','), '');
				else if ((data = expressions.select_where.exec(query)))
					result = BOT_Guard._qSelect(data[2], data[1].replace(/ /g, '').split(','), data[3]);
				else if ((data = expressions.add.exec(query)))
					result = BOT_Guard._qAdd(data[2], data[1]);
				else if ((data = expressions.delete.exec(query)))
					result = BOT_Guard._qDelete(data[2], data[1]);
				else if ((data = expressions.report.exec(query)))
					result = BOT_Guard._qReport(data[1], data[2]);

				for (var exId in expressions)
					expressions[exId].lastIndex = 0;

				query_results.push(result);
			});

			API.sendMessage(
				'**Result of queries**:\n\n' +
				query_results.join('\n\n**========== QUERY ==========**\n')
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
			'Welcome to the chat, @{' + user + '}!\n\n' +
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
	},

	// Querying functions
	_qSelect: function(from, select, where) {
		var data = {};
		if (from === 'users') data = this._users_data;
		else if (from === 'filtering_list') data = this._filtering_list;
		else return this._qError('Can not select data from **' + from + '**. Source does not exists');

		if (!where || where == '') where = 'true';

		where = where.replace(/([^.]|^)users(?:\.|$)/g, (_, c) => c + 'BOT_Guard._users_data[\'#{id}#\'].');
		where = where.replace(/([^.]|^)filtering_list(?:\.|$)/g, (_, c) => c + 'BOT_Guard._filtering_list[#{id}#].');

		where = where.replace(/and/gi, '&&');
		where = where.replace(/or/gi, '||');
		where = where.replace(/not/gi, '!');

		var selected = [];
		for (var dtId in data) {
			var data_where = where.replace(/#{id}#/g, dtId);
			var ats = eval(data_where);
			if (ats === true) selected.push(dtId);
			else if (ats !== false) {
				return this._qError(
					'Where returned __' + ats +
					'__ with type __' + (typeof ats) + '__ instead of boolean value'
				);
			}
		}

		var table = [];
		for (var dtId in selected) {
			if (select[0] === '*') {
				table.push(data[selected[dtId]]);
				continue;
			}

			var row = {};
			for (var sId in select) {
				var path = select[sId].split('.');
				var obj = data[selected[dtId]];
				var row_obj = row;

				for (var dst in path) {
					if (obj === undefined) {
						return this._qError('Source does not have value with path __' + select[sId] + '__');
					} else if (!obj.hasOwnProperty(path[dst])) {
						obj = undefined;
						continue;
					}

					obj = obj[path[dst]];

					if (!(path[dst] in row_obj) && dst != path.length - 1) {
						row_obj[path[dst]] = {};
						row_obj = row_obj[path[dst]];
					}
				}

				row_obj[path[path.length - 1]] = obj;
			}

			var rk = Object.keys(row);
			if (rk.length === 1)
				row = row[rk[0]];

			table.push(row);
		}

		return this._objectToMarkdown(table, 0, 2);
	},

	_qAdd: function(to, value) {
		if (to === 'users') this._addNewUser(value);
		else if (to === 'filtering_list') this.addWord(value);
		else return this._qError('Can not add data to **' + to + '**. Source does not exists');

		return 'Successfully added **"' + value + '"** to ' + to;
	},

	_qDelete: function(from, value) {

	},

	_qReport: function(user, reason) {
		if (!this._users_data.hasOwnProperty(user)) return this._qError('User @{' + user + '} does not exists');

		var user_data = this._users_data[user];
		user_data.reputation -= 2;
		user_data.violations[reason] = (user_data.violations[reason] || 0) + 1;

		API.sendMessage(
			'@{' + user + '} do not foul the rules!\n' +
			'You was reported for **' + reason + '**\n' +
			'Your reputation: **__' + user_data.reputation + '__**'
		);

		return 'User @{' + user + '} was reported successfully';
	},

	_qError: err => '**ERROR: ' + err + '**',

	_objectToMarkdown: function(object, padding, inc) {
		if (typeof object !== 'object') {
			if (typeof object === 'string') return '"' + object + '"';
			return object.toString();
		}

		var result = '[';
		if (object.hasOwnProperty('length')) {
			// Loop like an array
			for (var id = 0; id < object.length; ++id) {
				if (id != 0) result += ',';

				result += '\n' + strform.repeat(' ', padding + inc) + this._objectToMarkdown(object[id], padding + inc, inc);
			}

			if (object.length != 0) result += '\n';
			return result + strform.repeat(' ', padding) + ']'
		}


		result = '{';
		var keys = Object.keys(object);
		for (var id in keys) {
			var key = keys[id];
			if (id != 0) result += ',';

			result += '\n' + strform.repeat(' ', padding + inc) +
				'**' + key + '**: ' +
				this._objectToMarkdown(object[key], padding + inc, inc);
		}

		if (keys.length != 0) result += '\n';
		return result + strform.repeat(' ', padding) + '}';
	}
};

$(function() {
	API.logIn({
		'name': 'BOT_Guard',
		'password': 'BOT_Guard_%$Ep3I](-BT)'
	}, API.MODE_LOGIN, init);
});
