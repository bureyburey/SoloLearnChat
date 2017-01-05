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
		console.log(Notification.permission);
		if (Notification.permission === 'granted') new Notification(message);
		else if (Notification.permission !== 'denied') Notification.requestPermission(function (status) {
			new Notification(message);
		});
	}
}
