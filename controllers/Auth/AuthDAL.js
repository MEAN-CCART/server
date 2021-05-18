const db = require('../../_helpers/dbmongo');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const config = require('../../config/config.json');
let mongoDb = require('mongodb')


module.exports.authenticate = async (username, password, ipAddress) => {
    let dbo = await db;
    let user = await dbo.collection('auth').findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password))
        throw 'Invalid Username/Password';
    const jwtToken = generateJwtToken({ username: user.username, id: user._id });
    const refreshToken = await generateRefreshToken(user.username, user._id, ipAddress);

    return { ...userPublic(user), jwtToken, refreshToken: refreshToken.token }
}

module.exports.refreshToken = async (token, ipAddress) => {
    let dbo = await db;
    const refreshToken = await getRefreshToken(token);
    const user = await dbo.collection('auth').findOne({ username: refreshToken.user })

    // replace old refresh token with a new one and save
    const newRefreshToken = await generateRefreshToken(user.username, user._id, ipAddress);
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await dbo.collection('revokeToken').findOneAndReplace({ token: refreshToken.token }, { refreshToken });

    // generate new jwt
    const jwtToken = generateJwtToken({ username: user.username, id: user._id });;
    // return basic details and tokens
    return {
        ...userPublic(user),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

module.exports.revokeToken = async (token, ipAddress) => {
    let dbo = await db;
    const refreshToken = await getRefreshToken(token);
    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    let id = mongoDb.ObjectID
    let res = await dbo.collection('revokeToken').findOneAndReplace({ token: refreshToken.token }, { refreshToken });
}

module.exports.getAll = async () => {
    let dbo = await db;
    let users = await dbo.collection('auth').find().toArray();
    return users.map(userPublic)
}

module.exports.getById = async (id) => {
    const user = await getUser(id);
    return userPublic(user);
}

module.exports.getRefreshTokens = async (id) => {
    let dbo = await db;
    await getUser(id);

    const refreshTokens = await dbo.collection('refreshToken').find({ id: mongoDb.ObjectID(id) }).toArray();
    return refreshTokens;
}

async function getUser(id) {
    let dbo = await db;
    if (!mongoDb.ObjectID.isValid(id)) throw "User Not Found";
    const user = await dbo.collection('auth').findOne({ _id: mongoDb.ObjectID(id) });
    if (!user) throw "User Not Found"
    return user;
}

function generateJwtToken({ username, id }) {
    // create a jwt token containing the user id that expires in 15 minutes
    return jwt.sign({ username, id }, config.secret, { expiresIn: '15m' });
}

async function getRefreshToken(token) {
    let dbo = await db;
    const refreshToken = await dbo.collection('refreshToken').findOne({ token });
    
    console.log(refreshToken);
    if (!refreshToken || !isActive(refreshToken)) throw 'Invalid token';
    return refreshToken;
}

function isActive(refreshToken) {
    return !(Date.now() >= new Date(refreshToken.expires)) || !refreshToken.revoked;
}

async function generateRefreshToken(user, id, ipAddress) {
    // create a refresh token that expires in 7 days
    let dbo = await db;
    let token = randomTokenString()
    let result = await dbo.collection('refreshToken').insertOne(
        {
            user: user,
            id,
            token,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: ipAddress
        })
    return result.ops[0];
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function userPublic(user) {
    const { _id, firstname, lastname, username, role } = user;
    return { _id, firstname, lastname, username, role };
}



