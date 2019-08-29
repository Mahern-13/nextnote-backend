const express = require("express");
const router = express.Router();

const spotifyController = require("../controllers/spotifyController/spotifyController");

router.get("/login", spotifyController.login);

router.get("/callback", spotifyController.callback);

router.post("/access_token", spotifyController.access_token);

router.post("/get-spotify-data/:id?", spotifyController.getSpotifyData);

router.get("/search/:query?", spotifyController.search);

router.get("/:id?", spotifyController.apiWithoutOauth);

module.exports = router;
