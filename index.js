const express = require('express')
const socket = require('socket.io')
const app = express();
const request = require("request")
const sqlite = require('sqlite3')
const fs = require('fs')
const server = app.listen(process.env.PORT || 4000, () => console.log('listening on port 4000'))
app.use(express.static('public'))
const db = new sqlite.Database('data/todo.sqlite')
const io = socket(server)
let wdold = ''

io.on('connection', socket => {

    socket.on('wbUpdate', data => {
         socket.broadcast.emit('wbUpdate', data)
    }) 
    
    socket.on('wbDraw', data => {
        console.log(data)
        socket.broadcast.emit('wbDraw', data)
    })   


    socket.on('wbClear', data => {
        console.log(data)
        io.sockets.emit('wbClear', data)
    })


    socket.on('EditorSend', data => {
        console.log(data)
        io.sockets.emit('EditorSend', data)
    })

    socket.on('chat', data => {
        io.sockets.emit('chat', data)
    })

    socket.on('todoadd', data => {
        sql = `insert into todo values(null,'${data.todo}','${data.duedate}',null)`
        db.all(sql, (err, results) => {
            sql = 'select * from todo'
            db.all(sql, (err, results) => {
                io.sockets.emit('todoget', {
                    message: results
                })
            })
        })
    })

    socket.on('todoget', data => {
        sql = 'select * from todo'
        db.all(sql, (err, results) => {
            io.sockets.emit('todoget', {
                message: results
            })
        })
    })

    socket.on('tododel', data => {
        let sql = `delete from todo where id='${data.id}'`
        db.all(sql, (err, results) => {
            sql = 'select * from todo'
            db.all(sql, (err, results) => {
                io.sockets.emit('todoget', {
                    message: results
                })
            })
        })
    })

    socket.on('tododone', data => {

        let done
        if (data.done === 'checked') {
            done = ''
        } else {
            done = 'checked'
        }
        let sql = `update todo set done='${done}' where id='${data.id}'`
        db.all(sql, (err, results) => {
            sql = 'select * from todo'
            db.all(sql, (err, results) => {
                socket.broadcast.emit('todoget', {
                    message: results
                })
            })
        })
    })

    socket.on('RecipeSearch', data => {
        console.log(data)
        var url = `http://food2fork.com/api/search?key=3ce944466e75fa8252ea9b665ef3c4f3&q=${data.search}`
        request({
            url: url,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                const htdata = body
                    socket.emit('RecipeSearch', {htdata})
            } else{console.dir(error)}
        })
    })

    socket.on('WikiSearch', data => {
        console.log(data)
        var url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${data.search.replace(' ', '%20')}`
        request({
            url: url,
            json: true
        }, function (error, response, htdata) {
            if (!error && response.statusCode === 200) {
                    socket.emit('WikiSearch', {htdata:htdata.query.search})
            }
        })
    })

    socket.on('recipeget', data => {
        sql = 'select * from recipe'
        db.all(sql, (err, results) => {
            io.sockets.emit('recipeget', {
                results: results
            })
        })
    })

    socket.on('recipeadd', data => {
        sql = `insert into recipe values(null,'${data.title}','${data.ingredients}','${data.directions}')`
        db.all(sql, (err, results) => {
            console.log(err)
            sql = 'select * from recipe'
            db.all(sql, (err, results) => {
                io.sockets.emit('recipeget', {
                    results: results
                })
            })
        })
    })

})