var express = require("express");
var router = express.Router();

const spotifyController = require("../controllers/spotifyController/spotifyController");

router.get("/login", spotifyController.login);

router.get("/callback", spotifyController.callback);

router.post("/access_token", spotifyController.access_token);

router.post("/api-using-oauth/:id?", spotifyController.apiUsingOauth);

router.get("/search/:query?", spotifyController.search);

router.get("/:id?", spotifyController.apiWithoutOauth);

module.exports = router;
