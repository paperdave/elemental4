const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.resolve('./game/views'), { extensions: ['html'] }))
app.use(express.static(path.resolve('./res'), { extensions: ['html'] }))
app.use(express.static(path.resolve('./workshop'), { extensions: ['html'] }))
app.use(express.static(path.resolve('./dist_client'), { extensions: ['html'] }))

console.log('http://localhost:8000/')
app.listen(8000);
