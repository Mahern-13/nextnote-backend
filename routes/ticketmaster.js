var express = require("express");
var router = express.Router();
var axios = require("axios");

var knex = require("../knex/knex.js");

function authDataService() {
  return knex
    .select("auth_data")
    .from("authentication_info")
    .where({ app_name: "ticketmaster" })
    .then(function(rows) {
      if (rows.length > 0) {
        if (!rows[0].auth_data.access_token) {
          throw new Error("Authentication Token Doesn't Exist");
        }
        return rows[0].auth_data.access_token;
      }
    });
}

/* GET users listing. */
router.get("/:keyword?", function(req, res, next) {
  const { keyword } = req.params;
  console.log("params", keyword, req.params);
  return authDataService()
    .then(token => {
      return axios
        .get(
          `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${token}&keyword=${keyword}`
        )
        .then(response => {
          //console.log(response.data);
          //console.log(response.data.explanation);
          console.log("response", response);
          const { _embedded } = response.data;
          res.send(_embedded ? _embedded.events : []);
        });
    })
    .catch(err => {
      console.log("ERROR here", err);
      res.status(500).send("Error");
    });
});

module.exports = router;
