const functions = require("firebase-functions");
const fetch = require("node-fetch");
const firebase = require('firebase-admin');

firebase.initializeApp()

const firestore = firebase.firestore()

const appIds = fetch(
        "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/",
        {
            method: 'GET',
        }
    )
    .then(res => res.json())
    .then(res => res['response']['ranks'].map((rank) => rank['appid']))
    .catch(err => console.log(err));


const appDetail = (appId) => fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&l=french`,
        {
            method: 'GET'
        }
    )
    .then(res => res.json())
    .then(res => {
        return {
            appId: appId,
            title: res[appId]['data']['name'],
            editor: res[appId]['data']['publishers'][0],
            price: res[appId]['data']['price_overview'] && res[appId]['data']['price_overview']['initial_formatted'] ? res[appId]['data']['price_overview']['initial_formatted'] : 'free',
            //description: res[appId]['data']['detailed_description'],
            bgImage: res[appId]['data']['background']
        }
    })

const appSearch = (text) => fetch(
        `https://steamcommunity.com/actions/SearchApps/${text}`,
        {
            method: 'GET'
        }
    )
    .then(res => res.json())
    .then(res => {
        return res.map((r) => Number(r['appid']))
    }) 


exports.games = functions.https.onRequest(async (req, res) => {
    try {
        let response = await appIds
        res.status(200).send(JSON.stringify(response));
    }
    catch (err) {
        console.log(err);
		res.status(500).json({msg: `Error.`});
    }
})

exports.details = functions.https.onRequest(async (req, res) => {
    try {
        const id = req.query.appId;
        if(!id){
            res.status(400).json({msg: `No id.`});
        }
        let response = await appDetail(id);
        res.status(200).send(JSON.stringify(response));
    }
    catch (err) {
        console.log(err);
		res.status(500).json({msg: `Error.`});
    }
})

exports.search = functions.https.onRequest(async (req, res) => {
    try {
        const text = req.query.text
        if(!text) {
            res.status(400).json({msg: `No id.`});  
        }
        let response = await appSearch(text)
        res.status(200).send(JSON.stringify(response))
    }
    catch (err) {
        console.log(err);
		res.status(500).json({msg: `Error.`});
    }
})

exports.onUserCreate = functions.auth.user().onCreate((user) => {
    return firestore.collection('users').doc(user.uid).set(
        {
            liked: [],
            wished: []
        }
    )
    .then(() => console.log("User document created successfuly"))
    .catch((err) => console.log("User document creation failer " + err))
 }) 