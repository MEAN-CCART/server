const router = require('express').Router()
const db = require('../../_helpers/dbmongo')
const Roles = require('../../_helpers/roles')
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken')

const DAL = require('./AuthDAL');
const authorize = require('../../_helpers/authorize');

const saltRounds = 10;

router.get('/', (req, res) => {

    res.send('hello from auth server :)')

})
router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    DAL.authenticate(username, password, ipAddress).then(({ refreshToken, ...user }) => {
        setHttpOnlyCookie(res, refreshToken);
        res.json(user)
    }).catch(next)
})
router.post('/refreshToken', async (req, res, next) => {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    DAL.refreshToken(token, ipAddress)
        .then(({ refreshToken, ...user }) => {
            setHttpOnlyCookie(res, refreshToken);
            res.json(user)
        })
        .catch(next)
})
router.post('/revokeToken', authorize(), async (req, res, next) => {
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    DAL.revokeToken(token, ipAddress)
        .then(() => res.json({ message: 'Token Revoked' }))
        .catch(next)
})
router.get('/', authorize(Roles.Admin), (req, res, next) => {
    DAL.getAll()
        .then(users => res.json(users))
        .catch(next)
})
router.get('/:id', authorize(), selfOrAdmin, async (req, res, next) => {
    DAL.getById(req.params.id)
        .then(user => res.json(user))
        .catch(err => {
            console.error(err);
            next(err)
        })
})
router.get('/:id/refreshTokens', authorize(), selfOrAdmin, (req, res, next) => {
    DAL.getRefreshTokens(req.params.id)
        .then(tokens => tokens ? res.json(tokens) : res.sendStatus(404))
        .catch(res => {
            console.error(res);
        });
});

router.post('/register', async (req, res, next) => {
    try {
        let hash = await bcrypt.hash(req.body.password, saltRounds)
        // Store hash in your password DB.
        let user = {}
        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        user.username = req.body.username;
        user.password = hash;
        user.role = Roles.User;

        let dbo = await db;
        dbo.collection('auth').insertOne(user).then(result => {
            res.status(201).json({ _id: result.insertedId });
        }).catch(err => {
            throw err;
        })
    } catch (err) {
        next(err);
    }
})
function setHttpOnlyCookie(res, token) {
    // create http only cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function selfOrAdmin(req, res, next) {
    if (req.params.id !== req.user.id && req.user.role !== Roles.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
}

module.exports = router