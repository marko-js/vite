import other from "./other.marko";
import template from "./template.marko";

export function handler(req, res) {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    template.render({}, res);
  } else if (req.url === "/other") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    other.render({}, res);
  }
}
