const jwt = require('express-jwt');
const db = require('../_helpers/dbmongo')
const { secret } = require('../config/config.json');

function authorize(roles = []) {

    if (typeof roles === 'string') {
        roles = [roles];
    }
    return [
        jwt({ secret, algorithms: ['HS256'] }),
        async (req, res, next) => {
            let dbo = await db;
            const user = await dbo.collection('auth').findOne({ username: req.user.username });
            const refreshTokens = await dbo.collection('refreshToken').find({ user: user.username }).toArray()
            if (!user || (roles.length && !roles.includes(user.role))) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user.role = user.role;
            req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
            next();
        }
    ]

}
module.exports = authorize