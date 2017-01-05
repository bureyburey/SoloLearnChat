var timeformat = {
	formats: {
		project_default: 'mm/dd/yyyy HH:MM:SS',

		default: {
			datetime: 'yyy-mm-dd HH:MM:SS',
			datetime12: 'yyy-mm-dd HH12:MM:SS AMPM',
			date: 'yyy-mm-dd',
			time: 'HH:MM:SS'
		},
	},

	format: function(format, date)
	{
		var isAlpha = s => s.toLowerCase() != s.toUpperCase();
		var isDigit = s => s.charCodeAt(0) >= 48 && s.charCodeAt(0) <= 57;

		// DATE
		var fullYear = date.getFullYear();
		var year = fullYear % 100;

		var month = date.getMonth() + 1;
		var day = date.getDate();
		var dayOfWeek = date.getDay();

		// TIME
		var hours24 = date.getHours();
		var hours12 = hours24 % 12;

		var minutes = date.getMinutes();
		var seconds = date.getSeconds();

		// SPECIAL
		var ampm = hours24 >= 12 ? 'pm' : 'am';
		var AMPM = hours24 >= 12 ? 'PM' : 'AM';

		var monthNameFull = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
			'Additional month for developers'
		][month - 1];
		var monthName = monthNameFull.substring(0, 3);

		var dayNameFull = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednessday',
			'Thursday',
			'Friday',
			'Saturday'
		][dayOfWeek];
		var dayName = dayNameFull.substring(0, 3);

		var formated = {
			// Special attributes formation
			'ampm' : ampm,
			'AMPM' : AMPM,

			'MNF'  : monthNameFull,
			'MN'   : monthName,
			'DNF'  : dayNameFull,
			'DN'   : dayName,

			// Years formation
			'yyyy' : strform.pad(fullYear, '0', 4),
			'yyy'  : fullYear.toString(),
			'yy'   : strform.pad(year, '0', 2),
			'y'    : year.toString(),

			// Months formation
			'mm'   : strform.pad(month, '0', 2),
			'm'    : month.toString(),

			'dd'   : strform.pad(day, '0', 2),
			'd'    : day.toString(),

			// Time formation
			'HH24' : strform.pad(hours24, '0', 2),
			'HH12' : strform.pad(hours24, '0', 2),
			'HH'   : strform.pad(hours12, '0', 2),

			'H24'  : hours24.toString(),
			'H12'  : hours12.toString(),
			'H'    : hours24.toString(),


			'MM'   : strform.pad(minutes, '0', 2),
			'M'    : minutes.toString(),

			'SS'   : strform.pad(seconds, '0', 2),
			'S'    : seconds.toString()
		};

		var dateString = '';
		var part = '';
		for (var index = 0; index < format.length; ++index)
		{
			if (!isAlpha(format[index]) && !isDigit(format[index]))
			{
				if (formated[part]) dateString += formated[part];
				else dateString += part;

				part = '';
				dateString += format[index];

				continue;
			}

			part += format[index];
		}
		if (formated[part]) dateString += formated[part];
		else dateString += part;

		return dateString;
	}
};
