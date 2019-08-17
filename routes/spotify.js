var express = require("express");
var router = express.Router();
var axios = require("axios");
var {
  getSpotifyToken,
  handleSpotifyCallback,
  getSpotifyAuthorizeUrl,
  getSpotifyOAuthToken,
  getSpotifyArtist,
  getSpotifyTopTen,
  getSpotifyRelatedArtists
} = require("../spotify_helpers");

/* GET users listing. */

router.get("/login", function(req, res, next) {
  var url = getSpotifyAuthorizeUrl();
  res.redirect(url);
});

router.get("/callback", function(req, res, next) {
  code = req.query.code;
  handleSpotifyCallback(code);
  res.send("ok");
});

router.get("/api-using-oauth/:id?", function(req, res, next) {
  var id = req.params.id || "4dpARuHxo51G3z768sgnrY";
  getSpotifyOAuthToken().then(authData => {
    if (authData === "refreshFailed") {
      res.send({ error: "refresh_token_failed" });
    }
    axios
      .all([
        getSpotifyArtist(id, authData),
        getSpotifyTopTen(id, authData),
        getSpotifyRelatedArtists(id, authData)
      ])
      .then(
        axios.spread((currentArtist, topTracks, relatedArtists) =>
          res.send({
            currentArtist,
            topTracks,
            relatedArtists
          })
        )
      )
      .catch(err => {
        console.log(err);
      });
  });
});

router.get("/:id?", function(req, res, next) {
  var id = req.params.id || "4dpARuHxo51G3z768sgnrY";
  getSpotifyToken().then(authData => {
    axios
      .all([
        getSpotifyArtist(id, authData),
        getSpotifyTopTen(id, authData),
        getSpotifyRelatedArtists(id, authData)
      ])
      .then(
        axios.spread((currentArtist, topTracks, relatedArtists) =>
          res.send({
            currentArtist,
            topTracks,
            relatedArtists
          })
        )
      )
      .catch(err => console.log(err));
  });
});

module.exports = router;
