const http = require('http');
const file = require('fs');
const mime = require('mime');
const port = 3000;
const conn = require('./public/server.js');
const formidable = require('formidable');
const multiparty = require('multiparty');

conn.connect(error => {
    if (error) {
        console.log("Connection failed");
        throw error;
    } else {
        console.log("Database connected");
    }
});

http.createServer((req, res) => {
    let baseURL = req.protocol + '://' + req.headers.host + '/';
    let url = "public" + new URL(req.url, baseURL).pathname;
    switch (url) {
        case 'public/':
            url = 'public/index.html';
            break;
        case 'public/Book':
            url = 'public/Book.html';
            break;
        case 'public/Room':
            url = 'public/Rooms.html';
            break;
        case 'public/Contact':
            url = 'public/Contact.html';
            break;
        case 'public/BookingReport':
            url = 'public/BookingRoom.html';
            break;
        case 'public/RoomReport':
            url = 'public/RoomReport.html';
            break;
    }
    router(req, res, url);
}).listen(port);

function router(req, res, url) {
    switch (url) {
        case 'public/getRooms':
            getRooms(res);
            break;
        case 'public/getReservations':
            getReservations(res);
            break;
        case 'public/searchRoom':
            searchRoom(req, res);
            break;
        case 'public/checkRoom':
            checkRoom(req, res);
            break;
        case 'public/addRoom':
            addRoom(req, res);
            break;
        case 'public/bookRoom':
            bookRoom(req, res);
            break;
        case 'public/updateRoom':
            updateRoom(req, res);
            break;
        case 'public/updateReservation':
            updateReservations(req, res);
            break;
        case 'public/deleteRoom':
            deleteRoom(req, res);
            break;
        case 'public/deleteReservation':
            deleteReservation(req, res);
            break;
        default:
            file.readFile(url, (error, data) => {
                if (error) {
                    res.writeHead(404, { 'content-type': 'text/html' });
                    res.write('<h1>404 NOT FOUND</h1>');
                    return res.end();
                } else {
                    res.writeHead(200, { 'content-type': mime.getType(url) });
                    res.write(data);
                    return res.end();
                }
            });
            break;
    }
}

function getRooms(res) {
    let cmd = 'SELECT * FROM rooms';
    conn.query(cmd, (error, result) => {
        if (error) {
            console.log("Failed to load rooms");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'JSON' });
            let data = JSON.stringify(result);
            res.write(data);
            return res.end();
        }
    });
}

function getReservations(res) {
    let cmd = 'SELECT * FROM reservations';
    conn.query(cmd, (error, result) => {
        if (error) {
            console.log("Failed to load reservations");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'JSON' });
            let data = JSON.stringify(result);
            res.write(data);
            return res.end();
        }
    });
}

function searchRoom(req, res) {
    let params = new URLSearchParams(req.url.split('?')[1]);
    let type = params.get('type');
    let cmd = 'SELECT * FROM rooms WHERE Type LIKE ?';
    conn.query(cmd, type, (error, result) => {
        if (error) {
            console.log("Failed to load filter");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'JSON' });
            let data = JSON.stringify(result);
            res.write(data);
            return res.end();
        }
    });
}

function checkRoom(req, res) {
    let params = new URLSearchParams(req.url.split('?')[1]);
    let id = params.get('id');
    let cmd = `SELECT * FROM reservations WHERE RoomID = ${id}`;
    conn.query(cmd, (error, result) => {
        if (error) {
            console.log("Failed to check room");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'JSON' });
            let data = JSON.stringify(result);
            res.write(data);
            return res.end();
        }
    });
}

function bookRoom(req, res) {
    let data = '';
    req.on('data', chunks => {
        data += chunks;
    });
    req.on('end', () => {
        let form = JSON.parse(data);
        let cmd = `INSERT INTO reservations SET ?`;
        conn.query(cmd, form, (error, result) => {
            if (error) {
                console.log("Failed booking");
                throw error;
            } else {
                res.writeHead(200, { 'content-type': 'text/html' });
                return res.end();
            }
        });
    });
}

function addRoom(req, res) {
    // This section saves the image in the folder public -> images using the module formidable
    const form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        var oldpath = files.Picture.filepath;
        var newpath = 'public/images/' + files.Picture.originalFilename;
        console.log(newpath);
        file.copyFile(oldpath, newpath, function (error) {
            if (error) throw error;
        });
    });
    //This section parses the form using the module multiparty
    var formData = new multiparty.Form();
    formData.parse(req, (error, fields, files) => { //The callback function returns error if any, fields(properties), and files loaded
        var rowData = [
            fields.Type,
            files.Picture[0].originalFilename,
            fields.Beds,
            fields.Price
        ];
        var sqlCmd = 'INSERT INTO rooms (Type, Picture, Beds, Price) VALUES (?)';
        conn.query(sqlCmd, [rowData], (error, result) => {
            if (error) {
                console.log("Room Insert failed");
                throw error;
            } else {
                res.writeHead(200, { 'content-type': 'text/html' });
                res.end();
            }
        });
    });
}

function updateRoom(req, res) {
    var formData = new multiparty.Form();
    formData.parse(req, (error, fields, files) => { //The callback function returns error if any, fields(properties), and files loaded
        var sqlCmd;
        if (files.Picture == undefined) {
            sqlCmd = `UPDATE rooms SET Type = '${fields.Type}', Beds = ${fields.Beds}, Price = ${fields.Price} WHERE RoomID = ${fields.RoomID}`;
            conn.query(sqlCmd, (error, result) => {
                if (error) {
                    console.log("Room Update failed");
                    throw error;
                } else {
                    res.writeHead(200, { 'content-type': 'text/html' });
                    res.end();
                }
            });
        } else {
            sqlCmd = `UPDATE rooms SET Type = '${fields.Type}', Picture = '${files.Picture[0].originalFilename}', 
            Beds = ${fields.Beds}, Price = ${fields.Price} WHERE RoomID = ${fields.RoomID}`;
            conn.query(sqlCmd, (error, result) => {
                if (error) {
                    console.log("Room Update failed");
                    throw error;
                } else {
                    res.writeHead(200, { 'content-type': 'text/html' });
                    res.end();
                }
            });
            const form = new formidable.IncomingForm();

            form.parse(req, function (err, fields, files) {
                file.unlink(`./public/images/${fields.Pic}`, error => {
                    if (error) {
                        console.log("Picture switch failed");
                        throw error;
                    }
                    var oldpath = files.Picture.filepath;
                    var newpath = 'public/images/' + files.Picture.originalFilename;
                    console.log(newpath);
                    file.copyFile(oldpath, newpath, function (error) {
                        if (error) throw error;
                    });
                });
            });
        }
    });
}

function updateReservations(req, res) {
    let data = '';
    req.on('data', chunks => {
        data += chunks;
    });
    req.on('end', () => {
        let form = JSON.parse(data);
        let id = form.ReservationID;
        delete form.ReservationID;
        console.log(form)
        let cmd = `UPDATE reservations SET ? WHERE ReservationID = ?`;
        conn.query(cmd, [form, id], (error, result) => {
            if (error) {
                console.log("Reservation update failed");
                throw error;
            } else {
                res.writeHead(200, { 'content-type': 'text/html' });
                res.end();
            }
        });
    });
}

function deleteRoom(req, res) {
    let params = new URLSearchParams(req.url.split('?')[1]);
    let id = params.get('id');
    let img = params.get('img');
    file.unlink(`./public/Images/${img}`, (error) => {
        if (error) {
            console.log("Picture delete failed");
            throw error;
        }
    });
    let cmd = `DELETE FROM rooms WHERE RoomID = ${id}`;
    conn.query(cmd, (error, result) => {
        if (error) {
            console.log("Failed to Delete room");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'text/html' });
            return res.end();
        }
    });
}

function deleteReservation(req, res) {
    let params = new URLSearchParams(req.url.split('?')[1]);
    let id = params.get('id');
    let cmd = `DELETE FROM reservations WHERE ReservationID = ${id}`;
    conn.query(cmd, (error, result) => {
        if (error) {
            console.log("Failed to Delete room");
            throw error;
        } else {
            res.writeHead(200, { 'content-type': 'text/html' });
            return res.end();
        }
    });
}