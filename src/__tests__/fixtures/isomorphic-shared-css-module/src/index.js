import templateA from "./template-a.marko";
import templateB from "./template-b.marko";

export function handler(req, res) {
  const template =
    req.url === "/" ? templateA : req.url === "/second" ? templateB : null;
  if (template) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    template.render({}).pipe(res);
  }
}
