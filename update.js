const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function md5(file, cb) {
    var hash = crypto.createHash('md5'), 
    stream = fs.createReadStream(file);
    stream.on('data', data => hash.update(data, 'utf8'));
    stream.on('end', () => cb(hash.digest('hex')));
}

function walkSync(base, dir = '.', filelist = []) {
    for (var file of fs.readdirSync(path.join(base, dir))) {
        var abs = path.join(base, dir, file);
        if (fs.statSync(abs).isDirectory())
            walkSync(base, path.join(dir, file), filelist);
        else
            filelist.push(path.join(dir, file));
    }
    return filelist;
}

var manifest = {};
var folders = [];
for (var folder of fs.readdirSync('.')) {
    var base = path.join('.', folder);
    if (/^\./.test(folder) || !fs.statSync(folder).isDirectory()) continue;
    folders.push(folder);
    manifest[folder] = [];
    if (fs.statSync(base).isDirectory()) {
        for (let file of walkSync(base)) {
            file = file.replace(/\\/g, '/');
            manifest[folder].push({name: file, url: "https://github.com/dpwhittaker/RoC-Assets/raw/master/" + folder + "/" + file});
        }
    }
}

var folderIndex = 0;
var fileIndex = 0;

function writeHash(){
    var folder = folders[folderIndex];
    var base = path.join('.', folder);
    var file = manifest[folder][fileIndex];
    let abs = path.join(base, file.name);
    console.log(folder, file.name);
    md5(abs, hash => {
        file.hash = hash;
        file.size = fs.statSync(abs).size;
        console.log(hash);
        console.log(file.size);
        fileIndex++;
        if (fileIndex == manifest[folder].length) {
            fileIndex = 0;
            folderIndex++;
            if (folderIndex == folders.length) return done();
        }
        writeHash();
    });
}

writeHash();

function done() {
    fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2));
}