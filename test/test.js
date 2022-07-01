const pack = require("..");

pack.exec().then(r => console.log("Completed")).catch(er => {
    console.error(er)
});