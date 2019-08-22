var express = require("express");
var router = express.Router();
var axios = require("axios");

require("dotenv").config();

var knex = require("../knex/knex.js");

/* GET users listing. */
router.get("/:keyword?", function(req, res, next) {
  const { keyword } = req.params;
  return axios
    .get(
      `https://app.ticketmaster.com//discovery/v2/attractions.json?size=1&apikey=${
        process.env.TICKETMASTER_API_KEY
      }&keyword=${keyword}`
    )
    .then(response => {
      if (response.data._embedded) {
        const artistId = response.data._embedded.attractions[0].id;
        return axios
          .get(
            `https://app.ticketmaster.com/discovery/v2/events?apikey=${
              process.env.TICKETMASTER_API_KEY
            }&attractionId=${artistId}&locale=*&size=4`
          )
          .then(response => {
            const { _embedded } = response.data;
            const extractedEvents = _embedded ? _embedded.events : null;
            res.send(extractedEvents);
          });
      } else {
        res.send(null);
      }
    })
    .catch(err => {
      if (err.response && err.response.status === 429) {
        res.status(429).send("Error");
      } else {
        res.status(500).send("Error");
      }
    });
});

module.exports = router;
