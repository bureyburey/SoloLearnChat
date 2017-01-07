var notificationManager = {};
var initNotificationManager = function() {
	var notify_message = document.getElementById('notify_message');
	var notify_vibrate = document.getElementById('notify_vibrate');

	notificationManager.showNotification = function(message, title) {
		if('vibrate' in window && notify_vibrate.checked)
			navigator.vibrate(1000);
		
		if (!notify_message.checked) return;

		if (title != undefined) toastr.success(message, title);

		// If the browser does not supports notifications, don not run next code
		if (!('Notification' in window)) return;
		// Check whether notification permissions have already been granted
		// Otherwise, we need to ask the user for permission
		if (Notification.permission === 'granted') new Notification(message);
		else if (Notification.permission !== 'denied') Notification.requestPermission(function (status) {
			new Notification(message);
		});
	}
};
