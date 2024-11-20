import template from "./template.marko";

import imageUrl from "./image.svg";

export function handler(req, res) {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    template.render({ imageUrl }, res);
  }
}
