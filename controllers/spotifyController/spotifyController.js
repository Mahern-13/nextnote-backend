const authController = require("../authController");

const access_token = async (req, res, next) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send({ message: "Id is required" });
    return;
  }
  const [response, error] = await authController.getAccessToken(id);
  if (error) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.send(response);
};

module.exports = {
  access_token
};
