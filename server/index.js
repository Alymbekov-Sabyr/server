const WS = require('ws');

const server = new WS.Server({port:3000});

let waiting_games = [];
let connected_games = [];
let players = new Map();

server.on('connection', ws => {
    if (waiting_games.length==0) {
        players.set(players.size,ws);
        waiting_games.push({
            room: players.size+1,
            game_status: "search",
            data: {
                leader: players.size,
                players:[players.size],
                game: {
                    pl1:null,
                    pl2:null,
                    ball:null
                }
            }
        });
    } else {
        players.set(players.size,ws);
        waiting_games[0].data.players.push(players.size);
        waiting_games[0].game_status = "start"
        connected_games.push(waiting_games[0]);
        waiting_games[0].data.players.forEach(el => {
            waiting_games[0].client_id=el
            let obj = JSON.stringify(waiting_games[0])
            players.get(el-1).send(obj)
        });
        waiting_games.splice(0, 1);
    }
    ws.on('message',mes=>{
        let parse = JSON.parse(mes);
        
        if (parse.type=="pl-move") {
            let room = connected_games.filter((el)=>{
                return el.room == parse.room;
            });
            room[0]?.data?.players.forEach(el=>{
                if (el!=parse.client_id) {
                    players.get(el-1)?.send(JSON.stringify(parse));
                }
            });
        } else if (parse.type=="ball-move") {
            let room = connected_games.filter((el)=>{
                return el.room == parse.room;
            });
            room[0]?.data?.players.forEach(el=>{
                if (el!=parse.client_id) {
                    players.get(el-1)?.send(JSON.stringify(parse));
                }
            });
        } else if (parse.type=="finish") {
            let room = connected_games.filter((el)=>{
                return el.room == parse.room;
            });
            let new_arr = connected_games.filter((el)=>{
                return el.room != parse.room;
            });
            connected_games = new_arr;
            if (parse.winner!="another") {
                room[0].data.players.forEach(el=>{
                if (el!=parse.winner) {
                    players.get(el-1)?.send(JSON.stringify(parse));
                }
                players.delete(el-1);
            });
            } else {
                room[0].data.players.forEach(el=>{
                    if (el!=room[0].data.leader) {
                        players.get(el-1)?.send(JSON.stringify(parse));
                    }
                    players.delete(el-1);
                });
               
            }
            
        }
        
    });
})

server.on("disconnect",()=>{
    console.log("close");
});