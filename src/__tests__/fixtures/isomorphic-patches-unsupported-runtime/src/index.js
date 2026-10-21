import { patchRequestKind } from "@marko/vite/patch";

import template from "./template.marko";

export function handler(req, res) {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("x-kind", String(patchRequestKind(req.headers)));
    template.render({}).pipe(res);
  }
}
