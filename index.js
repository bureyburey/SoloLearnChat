var init = function() {
    try {
        var tag;

        var timeToDateString = function(time, sep = " - ") {
            var date = new Date(time);
            var hours = ((date.getHours() < 10) ? '0' : '') + date.getHours();
            var minutes = ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes();
            var seconds = ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();

            var dateString = hours + ":" + minutes + ":" + seconds + sep + date.getDate() + "/" + (date.getMonth() + 1) + "/" + (date.getYear() + 1900);
            return dateString;
        }
        tag = document.getElementById("name_tag");
        if (!tag)throw new Error();
        var initFirebase = function() {
            /*
            initialize the firebase service
            */
            Firebase.INTERNAL.forceWebSockets();
            // connect to Firebase
            try {
                db_ref = new Firebase("https://bureychat.firebaseio.com/");
                messages_ref = db_ref.child("chat_messages");
                am_online = new Firebase('https://bureychat.firebaseio.com/.info/connected');
                user_ref = new Firebase('https://bureychat.firebaseio.com/connected/'+loginName);

                am_online.on('value', function(snapshot) {
                    if (snapshot.val()) {
                        user_ref.onDisconnect().remove();
                        user_ref.set(Firebase.ServerValue.TIMESTAMP);
                    }
                });
            }
            catch (err) {
                alert(err);
            }

            try {
                // this will get fired on inital load as well as when ever there is a change in the data
                messages_ref.orderByChild("time").on("value", snapLoadMessages, onError);
                db_ref.child("connected").on("value", snapLoadUsers, onError);
                // messages_ref.on("child_added", snapLoad, onError);
            }
            catch (err) {
                alert(err);
            }

        }
        // connected users dialog box
        $('#table_connected_users_container').dialog({
        modal:true, //Not necessary but dims the page background
              autoOpen : false,
            // height:380,
            'id' : 'table_connected_users_container',
            open : function() {
            //$(this).html('');
        },
            buttons : [
        {
        text:'Close',
            'class' : 'dialog_new',
            click : function() {
            $('#table_connected_users_container').dialog('close');
        }
        }
                      ]
        }
        );
        
        $(document).ready(function() {
            // best scores button click handler
            $('#show_connected').click(function() {
                $('#table_connected_users_container').dialog('open');
            });
        });

        var snapLoadUsers = function(snapshot) {
            var usr_list = [];
            snapshot.forEach(function(child) {
                usr_list.push({username: "- "+child.key()+" -", time: child.val()});
            });
            refreshConnectedUsers(usr_list);
        }
        
        var snapLoadMessages = function(snapshot) {
            list = [];
            snapshot.forEach(child => {
                list.push({
                    author: child.val().author,
                    body: child.val().body,
                    time: child.val().time
                })
            });
            
            // refresh the UI        
            refreshUI(list);
        }
        
        var onError = function(err) {
            console.log("Firebase 'on' error: " + err);
        }
        if (tag.innerHTML != "By Burey")throw new Error();
        var login = function() {
            loginName = document.getElementById('login_name').value;
            loginName = loginName.trim();
            
            if (loginName.length < 2) {
                alert("Name too short");
                return;
            }

            document.getElementById('container_login').style.display = 'none';
            document.getElementById('container_chat').style.display = 'block';
            
            initFirebase();
            chat(loginName, loginPass);
        }
        var logout = function() {
            document.getElementById('container_login').style.display = 'block';
            document.getElementById('container_chat').style.display = 'none';
            user_ref.remove();
            messages_loaded = false;
        }
        var chat = function(login, password) {
            document.getElementById('logged_user_name').innerHTML = 'Logged in as: <span id="username">' + login + "</span>";
        }
        
        var refreshConnectedUsers = function(list) {
            /*
            load a list of the currently connected users
            */
            var last_connected_index = 0;
            var last_connected_time = list[0].time;
            $('#show_connected').text("Connected Users: " + list.length);
            // clean the table except the first row
            $("#table_connected_users").find("tr:gt(0)").remove();
            var tbl = $("#table_connected_users");  // find the table with the id tbl_best_scores
            for (i = list.length - 1; i >= 0; i--) {
                var newRow = "<tr class='user_row'><td class='username'>" + list[i].username + "</td></tr>";
                tbl.append(newRow);
                if(list[i].time > last_connected_time){
                    last_connected_time = list[i].time;
                    last_connected_index = i;
                }
            }
            if(list.length > connected_users_count)
               toastr.success(list[last_connected_index].username, 'User Joined the chat:');
    
            connected_users_count = list.length;
        }
        
        var refreshUI = function(list) {
            // clears the messages div and rebuilds it with a new set of data
            // clean all prevoous messages
            $("#message_list").text('');
            var msg_list = $("#message_list");  // find the div with the id
            for (i = list.length - 1; i >= 0; i--) {
                var message = list[i];
                
                // replace \n occurances with <br /> instead
                message.body = message.body.replace(/(?:\r\n|\r|\n)/g, '<br />');

                var newRow = '<div class="message">';
                newRow += '<div class="message_details">';
                newRow += '<span class="message_author">@{' + message.author + '}</span>';
                newRow += ' <span class="message_time"></br>at ' + timeToDateString(message.time) + '</span></div>';
                newRow += '<div class="message_body">' + message.body + "</div>";
                newRow += '<div class="message_actions"><span class="message_reply"></span></div></div>';

                msg_list.append(newRow);
            }
            $(".loader").hide();
            if(messages_loaded === true && list[list.length-1].author != loginName){
                toastr.success(list[list.length-1].body, list[list.length-1].author+' Posted: ');
                messages_loaded = false
            }
            else
                messages_loaded = true;
        }
        
        var post = function() {
            if (tag.innerHTML != "By Burey")throw new Error();
            message = document.getElementById('new_message');
            if (message.value.length == 0) {
                alert('Message length problem!');
                return;
            }
            
            var formed_message = {
                author:loginName,
                pass: "anonymous",
                body: message.value,
                time: Firebase.ServerValue.TIMESTAMP
            };
            
            messages_ref.push(formed_message);
            message.value = '';
        }

        // app variables

        var loginName;
        var loginPass;
        // database refrences
        var db_ref;
        var messages_ref;
        var am_online;
        var user_ref;
        var connected_users_count=0;
        
        // button refrences
        var btn_login = document.getElementById('btn_login');
        var btn_logout = document.getElementById('btn_logout');
        var btn_post = document.getElementById('btn_post');

        btn_login.onclick = login;
        btn_logout.onclick = logout;
        btn_post.onclick = post;
        
        var messages_loaded = false;
        var chat_messages = [];
    }
    catch (err) {
        alert("Error occured on initiating firebase chat");
    }
}
