const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb://localhost:27017";
var db = (async function () {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        console.log("Connecting to mongo");
        await client.connect();
        console.log("connected to mongo");
        return client.db('template')
    } catch (err) {
        console.log("Not connected", err.message);
    }
})();

module.exports = db;