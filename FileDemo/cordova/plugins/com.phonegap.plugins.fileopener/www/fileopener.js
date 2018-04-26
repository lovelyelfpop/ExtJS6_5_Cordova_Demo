var exec = require("cordova/exec");

function FileOpener() {};

FileOpener.prototype.open = function(fileName, success, failure) {
	exec(success || null, failure || null, "FileOpener", "open", [fileName]);
};

module.exports = new FileOpener();
