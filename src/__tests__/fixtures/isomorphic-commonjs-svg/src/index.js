import template from "./template.marko";

export function handler(req, res) {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    template.render(
      {},
      {
        write(chunk) {
          res.write(chunk);
        },
        end(chunk) {
          res.end(chunk);
        },
      },
    );
  }
}
