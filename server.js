require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json())
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization")
  next()
})
const jwt = require('jsonwebtoken')

let refreshTokens = []

const posts = [
  {
    username:'hugo',
    title:'post 1'
  },
  {
    username:'james',
    title:'post 2'
  },
  {
    username:'hugo',
    title:'post 3'
  }
]

const users = [
  {
    username:'hugo',
    password:'Bivc1701'
  }
]

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if(token === null) return res.sendStatus(401)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

const generateToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15min'})
}

app.get('/posts', authenticateToken, (req, res)=>{
  res.status(200).send({posts:posts.filter(post => post.username == req.user.username)})
})

app.post('/newuser', (req, res)=>{
  const user = {username: req.body.username, password:req.body.password}
  users.push(user)
  res.status(201).send({msg:'user created'})
})

app.get('/verify', authenticateToken, (req, res)=> {
  res.sendStatus(200)
})

app.post('/login', (req, res)=>{
  const user = users.find(user => user.username = req.body.username)
  if(user == null) return res.status(400).send({msg:'Cannot find user'})
  if(req.body.password == user.password){
    const accessToken = generateToken(user)
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push(refreshToken)
    res.status(201).send({accessToken:accessToken, refreshToken:refreshToken})
  }else{
    res.status(403).send({msg:'Password Invalid'})
  }
})

app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if(refreshToken == null) return res.sendStatus(401)
  if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403)
    const accessToken = generateToken({username: user.username})
    res.status(201).send({accessToken:accessToken})
  })
})


app.listen(5000)
