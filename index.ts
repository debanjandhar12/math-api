import express from "express";
import { urlencoded } from "body-parser";
import helmet from "helmet";
import { tex2svg } from "./adaptor";
import cors from "cors";
const app = express();

app.use(helmet());
app.use(urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

app.get("*", async function (req, res, next) {
  const mode = Object.keys(req.query).includes("from")
    ? "block"
    : Object.keys(req.query).includes("inline")
    ? "inline"
    : null;
  if (!mode) {
    return next();
  }
  const isInline = mode === "inline";
  const equation = isInline
    ? (req.query.inline as string)
    : (req.query.from as string);
  if (!equation || equation.match(/\.ico$/)) {
    return next();
  }

  const color = req.query.color as string | undefined;
  const bgColor = req.query.bgcolor as string | undefined;

  if (color && /[^a-zA-Z0-9#]/.test(color)) {
    return next();
  }
  if (bgColor && /[^a-zA-Z0-9#]/.test(bgColor)) {
    return next();
  }

  const normalizedEquation = equation.replace(/\.(svg|png)$/, "");

  try {
    const svgString = tex2svg(normalizedEquation, isInline, color, bgColor);

    res.setHeader("cache-control", "s-maxage=604800, max-age=604800");
    res.contentType("image/svg+xml");
    res.write(`<?xml version="1.0" standalone="no" ?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
`);

    res.end(svgString);
  } catch (err) {
    res.status(500);
    res.write(
      '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="15" font-size="15">'
    );
    res.write(err);
    res.end("</text></svg>");
  }
});

app.get("/", function (req, res) {
  res.redirect(301, "/home");
});

export default app;
