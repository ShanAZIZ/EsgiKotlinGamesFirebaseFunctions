const functions = require("firebase-functions");
const fetch = require("node-fetch");

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
            description: res[appId]['data']['detailed_description'],
            gbImage: res[appId]['data']['background']
        }
    })


exports.games = functions.https.onRequest(async (req, res) => {
    try {
        let response = await appIds
        let games = await Promise.all(response.map(async (appId) => {
            console.log(appId)
            return await appDetail(appId).catch(() => null)
        }))
        console.log(games);
        res.status(200).send(JSON.stringify(games));
    }
    catch (err) {
        console.log(err);
		res.status(500).json({msg: `Error.`});
    }
})