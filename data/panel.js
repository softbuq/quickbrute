self.port.on("VersionInfo", function handleMyMessage(myMessagePayload) {
    document.getElementById("versionNumber").textContent = "";
    document.getElementById("versionNumber").textContent = myMessagePayload;
});

self.port.on("userList", function handleMyMessage(myMessagePayload) {
    document.getElementById("userNames").innerHTML = "";
    var htmlUserList = document.createElement('div');
    for (let element of myMessagePayload) {
        let userItem = document.createElement("dd");
        userItem.textContent = element;
        htmlUserList.appendChild(userItem);
    }
    document.getElementById("userNames").appendChild(htmlUserList);
});

self.port.on("passwordsFound", function handleSucLogin(foundPasswords) {
    document.getElementById("sucLogin").innerHTML = "";
    var htmlPassList = document.createElement('div');
    for (let password of foundPasswords) {
        let passItem = document.createElement("dd");
        passItem.textContent = password;
        htmlPassList.appendChild(passItem);
    }
    document.getElementById("sucLogin").appendChild(htmlPassList);
});

self.port.on("dbCreds", function handledbCreds(dbCreds) {
    document.getElementById("dbCreds").textContent = "";
    document.getElementById("dbCreds").textContent = dbCreds;
});;
