import templateOne from "./template-one.marko";
import templateThree from "./template-three.marko";
import templateTwo from "./template-two.marko";

export function handler(req, res) {
  const template =
    req.url === "/"
      ? templateOne
      : req.url === "/two"
        ? templateTwo
        : req.url === "/three"
          ? templateThree
          : null;
  if (template) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    template.render({}).pipe(res);
  }
}
