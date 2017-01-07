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

		'loader': document.getElementById('loader'),

		// JQuery entities
		'j_document': $(document)
	};
	
	// List of PRIVATE module functions
	var swapVisible = function(containerToShow, containerToHide) {
		containers[containerToShow].style.display = 'block';
		containers[containerToHide].style.display = 'none';
	};

	pageManager._messages_loaded = false;
	
	// List of PUBLIC module functions
	pageManager.getContainer = name => containers[name];

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
	pageManager.addToMessage = text => containers.new_message.value += text;

	pageManager.rememberMe = () => containers.remember_me.checked === true;

	pageManager.showLoader = () => containers.loader.style.display = 'block';
	pageManager.hideLoader = () => containers.loader.style.display = 'none';

	pageManager.updateMessages = function(messages) {
		var formMessage = function(message) {
			var html = '<div class="message_details">';
			html += '<span class="message_author">@{' + message.author + '}</span>';
			
			html += '<span class="user_controls" data-messageId="' + message.id + '">';
			html += '<span class="user_control" name="edit_message">&#x270F;</span>';
			html += '<span class="user_control" name="delete_message">&#x1f5d1;</span>';
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
	};

	pageManager.updateConnectedUsers = function(users) {
		// Sort users by join time
		var users_joined = API._getJoinedUsers();

		users.sort((a, b) => a.time - b.time);

		$('#show_connected').text('Connected Users: ' + users.length);

		// clean the table except the first row
		var tbl = $('#table_connected_users');
		tbl.find('tr:gt(0)').remove();
		
		for (var i = 0; i < users.length; ++i) {
			var html = '<tr class="user_row"><td class="username">' + users[i].name + '</td></tr>';
			tbl.append(html);
		}
		
		for (var userId in users_joined)
			notificationManager.showNotification(users_joined[userId].name + ' joined the chat', '[Chat]');
	};

	// functions to work with message editing
	var anchor = 0;
	pageManager.setAnchor = value => anchor = value;
	pageManager.getAnchor = () => anchor;
	pageManager.scrollTo = (anchor, time) => window.scrollTo(anchor, time);
};
