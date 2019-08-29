const axios = require("axios");
const {
  getSpotifyToken,
  handleSpotifyCallback,
  getSpotifyAuthorizeUrl,
  getSpotifyOAuthToken,
  getSpotifyArtist,
  getSpotifyTopTen,
  getSpotifyRelatedArtists
} = require("./spotify-helpers");

const SpotifyModel = require("../../models/SpotifyModel");

const access_token = async (req, res, next) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send({ message: "Id is required" });
    return;
  }
  const [response, error] = await SpotifyModel.getAccessToken(id);
  if (error) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.send(response);
};

const callback = async function(req, res, next) {
  code = req.query.code;
  const id = await handleSpotifyCallback(code);
  res.redirect(`http://localhost:4000?spotify_auth=true&id=${id}`);
};

const login = function(req, res, next) {
  const url = getSpotifyAuthorizeUrl();
  res.redirect(url);
};

const fetchSpotifyData = (artistId, access_token) => {
  return axios
    .all([
      getSpotifyArtist(artistId, access_token),
      getSpotifyTopTen(artistId, access_token),
      getSpotifyRelatedArtists(artistId, access_token)
    ])
    .then(
      axios.spread((currentArtist, topTracks, relatedArtists) => {
        return {
          currentArtist,
          topTracks,
          relatedArtists
        };
      })
    );
};

const getSpotifyData = function(req, res, next) {
  const artistId = req.params.id || "4dpARuHxo51G3z768sgnrY";
  const { userId, access_token } = req.body;
  try {
    return fetchSpotifyData(artistId, access_token)
      .then(response => res.send(response))
      .catch(async err => {
        if (err.response.status === 401) {
          const authData = await getSpotifyOAuthToken(userId);

          if (authData === "refreshFailed") {
            res.send({ error: "refresh_token_failed" });
            return;
          }

          return fetchSpotifyData(artistId, authData.access_token).then(
            response => res.send(response)
          );
        }
        res.status(500).send(err.message);
      });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const search = function(req, res, next) {
  const { userId } = req.query;
  const query = req.params.query || "Adele";
  return getSpotifyOAuthToken(userId)
    .then(authData => {
      const url = `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`;
      return axios
        .get(url, {
          headers: {
            Authorization: "Bearer " + authData.access_token
          }
        })
        .then(response => res.send(response.data.artists.items[0]));
    })
    .catch(err => console.log(err));
};

const apiWithoutOauth = function(req, res, next) {
  const id = req.params.id || "4dpARuHxo51G3z768sgnrY";
  return getSpotifyToken()
    .then(authData => {
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
        );
    })
    .catch(err => console.log(err));
};

module.exports = {
  access_token,
  callback,
  login,
  getSpotifyData,
  search,
  apiWithoutOauth
};
