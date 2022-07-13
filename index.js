const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('view', path.join(__dirname, '/views'));

app.get('/', (req, res) => {
    res.send("all good")
})

const port = 5000
app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})