const http = require("http");
const fs = require("fs/promises");
const { pipeline } = require("stream");

class CobiExpress {
  constructor() {
    this.server = http.createServer();
    this.middleware = [];
    this.routes = {};
    this.server.on("request", (req, res) => {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };

      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };

      res.sendFile = async (path, mime) => {
        res.setHeader("Content-Type", mime);
        const file = await fs.open(path, "r");
        const stream = file.createReadStream();
        pipeline(stream, res, async () => {
          await file.close();
          res.end();
        });
      };

      if (!this.routes[req.method.toLowerCase() + req.url]) {
        res.status(404).json({ error: `cannot ${req.method} ${req.url}` });
      }

      const runMiddlewares = (req, res, middleware, index) => {
        if (index === middleware.length) {
          this.routes[req.method.toLowerCase() + req.url](req, res);
        } else {
          middleware[index](req, res, () => {
            runMiddlewares(req, res, middleware, index + 1);
          });
        }
      };

      runMiddlewares(req, res, this.middleware, 0);
    });
  }
  listen(port, cb) {
    this.server.listen(port, () => {
      cb();
    });
  }

  route(method, route, cb) {
    this.routes[method.toLowerCase() + route] = cb;
  }

  beforeEach(cb) {
    this.middleware.push(cb);
  }
}

module.exports = CobiExpress;
