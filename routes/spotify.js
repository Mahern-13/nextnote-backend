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
const authController = require("../controllers/authController");

/* GET users listing. */

router.get("/login", function(req, res, next) {
  var url = getSpotifyAuthorizeUrl();
  res.redirect(url);
});

router.get("/callback", async function(req, res, next) {
  code = req.query.code;
  const id = await handleSpotifyCallback(code);
  res.redirect(`http://localhost:4000?spotify_auth=true&id=${id}`);
});

router.post("/access_token", async (req, res, next) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send({ message: "Id is required" });
    return;
  }
  const [response, error] = await authController.getAccessToken(id);
  if (error) {
    res.status(401).send("Unauthorised");
    return;
  }
  res.send(response);
});

router.post("/api-using-oauth/:id?", function(req, res, next) {
  var artistId = req.params.id || "4dpARuHxo51G3z768sgnrY";
  const { userId } = req.body;
  getSpotifyOAuthToken(userId)
    .then(authData => {
      if (authData === "refreshFailed") {
        res.send({ error: "refresh_token_failed" });
        return;
      }
      return axios
        .all([
          getSpotifyArtist(artistId, authData),
          getSpotifyTopTen(artistId, authData),
          getSpotifyRelatedArtists(artistId, authData)
        ])
        .then(
          axios.spread((currentArtist, topTracks, relatedArtists) =>
            res.send({
              currentArtist,
              topTracks,
              relatedArtists
            })
          )
        );
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err.message);
    });
});

router.get("/search/:query?", function(req, res, next) {
  const { userId } = req.query;
  var query = req.params.query || "Adele";
  getSpotifyOAuthToken(userId).then(authData => {
    url = `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`;
    return axios
      .get(url, {
        headers: {
          Authorization: "Bearer " + authData.access_token
        }
      })
      .then(response => res.send(response.data.artists.items[0]))
      .catch(err => console.log(err));
  });
});

router.get("/:id?", function(req, res, next) {
  var id = req.params.id || "4dpARuHxo51G3z768sgnrY";
  getSpotifyOToken().then(authData => {
    return axios
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
