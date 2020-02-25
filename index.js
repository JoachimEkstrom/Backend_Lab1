const fs = require('fs')
const url = require('url')
const express = require('express')
const app = express()
app.use(express.static('public'))
const server = require('http').Server(app)
const io = require('socket.io')(server)
server.listen(8080, () => console.log('Server is up'))


const valdata = require('./valdata.json')
let nuvaranadeVallokal

app.get('/', (req, res) => {

    let username = url.parse(req.url, true).query.username
    let password = url.parse(req.url, true).query.password

    if (username === 'Berra' && password === 'lol') {
        res.sendFile(__dirname + '/loggedin.html')
    } else {
        res.sendFile(__dirname + '/index.html')
    }

})



io.on('connection', (socket) => {
    // Välkomst meddelande vid upprättande av kontakt
    socket.emit('hello', { hello: 'Hello!!'})

    // När någon vill ha senaste resultaten -> sker vid inlogg på allmäna sidan
    socket.on('updateMe', (valdValLokal) => {
        nuvaranadeVallokal = valdValLokal
         update(valdValLokal)
     
    })
    
    // När någon vill ha senaste resultaten -> från en specifik vallokal
    socket.on('updateVallokal', (valdValLokal) => {
        nuvaranadeVallokal = valdValLokal
        updateVallokal(valdValLokal)

    })

    // När någon skickar in nya valresultat
    socket.on('valresultat', ( valresultat ) => {
        addData(valresultat, () => {

            //skicka updatering till Allmänasidan
            update(nuvaranadeVallokal)
        })
    })

    // När någon vill ha senaste resultaten
    function update(valdValLokal) {
        let vallokaler = getValLokaler()
        resultat = readData(valdValLokal)
            io.emit('updates', resultat)
            io.emit('lokaler', vallokaler)
    }
    // När någon vill ha senaste resultaten från sin valda vallokal
    function updateVallokal(valdValLokal) {
        resultat = readData(valdValLokal)
        io.emit('updates', resultat)

    }
})

// lägg till data i JSON-filen 
function addData(valresultat, callback) {
        valdata.push(valresultat)
        let data = JSON.stringify(valdata)

        fs.writeFile('./valdata.json', data, (err) => {
            if (err) throw err
            console.log('Valresultat sparat')
        })
    callback()
}

// Kolla vilka vallokaler som för tillfället har fått sina röster rapporterade
function getValLokaler() {
    let lokaler = []
    for( i = 0; i < valdata.length; i++){
        if (!lokaler.includes(valdata[i].valLokal)){
            lokaler.push(valdata[i].valLokal)
        }
    }
    console.log(lokaler)
    return lokaler
}


// läs in JSON-filen
function readData(valLokalen) {
    let showResults = {
        valLokal: valLokalen,
        allmannaPartiet: 0,
        speciellaPartiet: 0,
        skarskildaPartiet: 0,
        ovrigaRoster: 0,
        ogiltligaRoster: 0
    }

    
    valdata.forEach(element => {
        if (element.valLokal === showResults.valLokal) {
            showResults.allmannaPartiet += +element.allmannaPartiet
            showResults.speciellaPartiet += +element.speciellaPartiet
            showResults.skarskildaPartiet += +element.skarskildaPartiet
            showResults.ovrigaRoster += +element.ovrigaRoster
            showResults.ogiltligaRoster += +element.ogiltligaRoster
        } else if (showResults.valLokal === 'alla'){
            showResults.allmannaPartiet += +element.allmannaPartiet
            showResults.speciellaPartiet += +element.speciellaPartiet
            showResults.skarskildaPartiet += +element.skarskildaPartiet
            showResults.ovrigaRoster += +element.ovrigaRoster
            showResults.ogiltligaRoster += +element.ogiltligaRoster
        }
    })

    console.log(showResults)
    return showResults


}