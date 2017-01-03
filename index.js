
// app variables

var loginName;
var loginPass;
// database refrences
var db_ref;
var messages_ref;
var am_online;
var user_ref;
var connected_users_count=0;
var connected_users_list = [];
var last_message_ref;
var messages_loaded = false;
var FIREBASE_ADDR = "https://sololearnfirebasechat-5bb04.firebaseio.com";

// button refrences
var btn_login;
var btn_logout;
var btn_post;

var MESSAGES_TO_LOAD = 100;

function init() {
    try {
        
    // Toastr options
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-top-left",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }


        var notifyMe = function(message) {
          // Let's check if the browser supports notifications
          if (!("Notification" in window)) {
            // alert("This browser does not support desktop notification");
          }
          // Let's check whether notification permissions have already been granted
          else if (Notification.permission === "granted") {
                // If it's okay let's create a notification
            var notification = new Notification(message);
            }
             // Otherwise, we need to ask the user for permission
            else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                var notification = new Notification(message);
                }
            });
        }
          // At last, if the user has denied notifications, and you 
          // want to be respectful there is no need to bother them any more.
    }

     var textToHtml = function(text) {
        text = escapeHtml(text);
        text = text.replace(/\n/g, '<br>');
        
        text = text.replace(
            /([^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
            (_, smb, name, url) => smb + '<a href="' + url + '">' + name + '</a>'
        );
        
        text = text.replace(/([^\\]|^)\*\*(.+?)\*\*/g, (_, smb, content) => smb + '<b>' + content + '</b>');
        text = text.replace(/([^\\]|^)__(.+?)__/g, (_, smb, content) => smb + '<i>' + content + '</i>');
        
        text = text.replace(/\\(.)/g, (_, character) => character);
        
        return text;
    }
    
     var escapeHtml = function(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
    
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }


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
                db_ref = new Firebase(FIREBASE_ADDR);
                messages_ref = db_ref.child("chat_messages");
                am_online = new Firebase(FIREBASE_ADDR+'/.info/connected');
                user_ref = new Firebase(FIREBASE_ADDR+'/connected/'+loginName);
                user_history_ref = new Firebase(FIREBASE_ADDR+'/user_last_logged/'+loginName);
                user_history_ref.set(Firebase.ServerValue.TIMESTAMP);
                // create listener when new user is logged in
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
                messages_ref.orderByChild("time").limitToLast(MESSAGES_TO_LOAD).on("value", snapLoadMessages, onError);
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
        
        $('#about_dialog').dialog({
        modal:true, //Not necessary but dims the page background
              autoOpen : false,
            // height:380,
            'id' : 'about_dialog',
            open : function() {
            //$(this).html('');
        },
            buttons : [
        {
        text:'Close',
            'class' : 'dialog_new',
            click : function() {
            $('#about_dialog').dialog('close');
        }
        }
                      ]
        }
        );
        
        $(document).ready(function() {
            // connected users button click handler
            $('#show_connected').click(function() {
                $('#table_connected_users_container').dialog('open');
            });
            // aboout window click handler
                        $('.about').click(function() {
                $('#about_dialog').dialog('open');
            });
        });

    
        var snapLoadUsers = function(snapshot) {
            var usr_list = [];
            
            snapshot.forEach(function(child) {
                usr_list.push({username: "- "+child.key()+" -", time: child.val()});
            });
            connected_users_list = usr_list;
            refreshConnectedUsers(usr_list);
        }
        
        var snapLoadMessages = function(snapshot) {
            list = [];
            snapshot.forEach(child => {
                list.push({
                    author: child.val().author,
                    body: textToHtml(child.val().body),
                    time: child.val().time,
                    id: child.key()
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
            loginPass = document.getElementById('login_pass').value;
            loginPass = loginPass.trim();
            
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
            db_ref.off();
            messages_ref.off();
            am_online.off();
            user_ref.off();
            user_history_ref.off();
            messages_loaded = false;
            
        }
        var chat = function(login, password) {
            document.getElementById('logged_user_name').innerHTML = 'Logged in as: <span id="username">' + login + "</span>";
            toastr.info('Welcome To the Chat!', 'Hello ' + login + '!!!');
        }
        
        var refreshConnectedUsers = function(list) {
            /*
            load a list of the currently connected users
            */
            var last_connected_index = 0;
            if(list.length > 0)
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
        if(list.length > connected_users_count && $('#chkbox_notify').is(':checked')){
                
               toastr.success(list[last_connected_index].username, 'User Joined the chat:');
                notifyMe(list[last_connected_index].username + "Joined the chat");
            }
    
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
                // message.body = message.body.replace(/(?:\r\n|\r|\n)/g, '<br />');

                var newRow = '<div class="message">';
                newRow += '<div class="message_details">';
                newRow += '<span class="message_author">@{' + message.author + '}</span>';
                
                newRow += '<span id='+message.id+'>';
                newRow += '<span class="edit_message">&#x270F;</span>';
                newRow += '<span class="delete_message">&#x1f5d1;</span>';
                newRow += '</span>';
                
                newRow += ' <span class="message_time"></br>at ' + timeToDateString(message.time) + '</span></div>';
                newRow += '<div class="message_body">' + message.body + "</div>";
                newRow += '<div class="message_actions"><span class="message_reply"></span></div></div>';

                msg_list.append(newRow);
            }
            $(".loader").hide();
            
            if(messages_loaded === true && list[list.length-1].author != loginName){
                messages_loaded = false;
                
                if($('#chkbox_notify').is(':checked')){
                    
                toastr.success(list[list.length-1].body, list[list.length-1].author+' Posted: ');
                notifyMe(list[list.length-1].author + ' posted: ' + list[list.length-1].body);
                    
                }
            }
            else
                messages_loaded = true;
                
            last_message_ref = list[list.length-1];
        }
        
        var post = function() {
            if (tag.innerHTML != "By Burey")throw new Error();
            message = document.getElementById('new_message');
            if (message.value.length == 0) {
                alert('Message length problem!');
                return;
            }
            
            var formed_message = {
                author: loginName,
                pass: loginPass,
                body: message.value,
                time: Firebase.ServerValue.TIMESTAMP
            };
            
            messages_ref.push(formed_message);
            message.value = '';
        }


        btn_login = document.getElementById('btn_login');
        btn_logout = document.getElementById('btn_logout');
        btn_post = document.getElementById('btn_post');

        btn_login.onclick = login;
        btn_logout.onclick = logout;
        btn_post.onclick = post;
        
    $(document).ready(function(){
            $(".emoji_table").on('click',function(){
                var txt = $.trim($(this).text());
                var box = $("#new_message");
                if(txt==="URL")
                    box.val(box.val() + '[url:LinkName](http://address)');
                else
                    box.val(box.val() + txt);
            });
            
            
            // $(document).on('click','.edit_message',function(){
            //     var id = $(this).parent().attr("id");
            //     var message_author = $(this).parent().parent().find('.message_author').text();
            //     var message_body = $(this).parent().parent().parent().find('.message_body').text();
                
            //     // messages_ref.child(id).update({author: loginName, pass: loginPass, body: timeToDateString(Date.now())});
            //     messages_ref.child(id).update({body: timeToDateString(Date.now())});
            //     //alert("TO IMPLEMENT:\nedit:\nid: " + id + "\nauthor: " + message_author + "\nbody: " + message_body);
            // });
            
            /*
            $(document).on('click','.delete_message',function(){
                var id = $(this).parent().attr("id");
                var message_author = $(this).parent().parent().find('.message_author').text();
                var message_body = $(this).parent().parent().parent().find('.message_body').text();
                alert("TO IMPLEMENT:\ndelete:\nid: " + id + "\nauthor: " + message_author + "\nbody: " + message_body);
            });*/
            
         });
         
         
         
         
                 
        var Bot_API = {
             addMessageListener: function(func){
                
            },
            
            getConnectedUsers: connected_users_list,
            
            postMessage: function(msg){
                
            }
            
           
        }
        
        
        //  document.write(Bot_API.getConnectedUsers)
    }
    catch (err) {
        alert("Error occured on initiating firebase chat");
    }
}
