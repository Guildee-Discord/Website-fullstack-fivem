const express = require("express");
const config_website = require("../../../configuration/website.json");

module.exports = (ctx) => {
  const router = express.Router();

  router.get("/404", async (req, res, next) => {
    try {
      const website = config_website.website || {};
     
      res.render("404", {
        errorMessages: [],
        toast: null,
        config: website,
        user: req.user || null,
        websiteColor: website.color || "#5865f2",
        websiteLogo: website.logoUrl || null,
        requireTos: website.requireTos === true,
      });
    } catch (err) {
      console.error(err);
    }
  });

  return router;
};