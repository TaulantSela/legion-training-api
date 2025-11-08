require("dotenv").config();
const { app, initDocs } = require("./app");

const PORT = process.env.PORT || 3000;
const isVercel = ["1", "true", "TRUE"].includes(process.env.VERCEL);

if (!isVercel) {
  initDocs(PORT);
  app.listen(PORT, () => {
    console.log(`Legion API is listening on port ${PORT}`);
  });
}

module.exports = app;

/* 
CACHE 
A few things you have to be aware of when using a cache:

  * you always have to make sure that the data inside the cache is up to date because you don't want to serve outdated data
  * while the first request is being processed and the cache is about to be filled and more requests are coming in, you have to decide if you delay those other requests and serve the data from the cache or if they also receive data straight from the database like the first request
  * it's another component inside your infrastructure if you're choosing a distributed cache like Redis (so you have to ask yourself if it really makes sense to use it)
*/
