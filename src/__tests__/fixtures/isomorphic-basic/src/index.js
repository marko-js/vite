import http from "http";
import template from "./template.marko";

http
  .createServer((req, res) => {
    template.render({}, res);
  })
  .listen();
