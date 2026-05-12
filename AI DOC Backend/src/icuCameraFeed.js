const http = require("http");
const https = require("https");

const ICU_CAMERA_FEED_URL = process.env.ICU_CAMERA_FEED_URL || "http://98.130.96.220:3000/";

function proxyIcuCameraFeed(req, res) {
  const upstreamUrl = new URL(req.url || "/", ICU_CAMERA_FEED_URL);
  const transport = upstreamUrl.protocol === "https:" ? https : http;

  const upstreamRequest = transport.request(
    upstreamUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: upstreamUrl.host,
        connection: "keep-alive",
      },
    },
    (upstreamResponse) => {
      res.statusCode = upstreamResponse.statusCode || 502;

      Object.entries(upstreamResponse.headers).forEach(([headerName, headerValue]) => {
        if (typeof headerValue === "undefined") {
          return;
        }

        res.setHeader(headerName, headerValue);
      });

      upstreamResponse.pipe(res);
    }
  );

  upstreamRequest.on("error", (error) => {
    console.error("[icu-stream] proxy error", error.message);

    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader("content-type", "text/plain; charset=utf-8");
    }

    res.end("Unable to reach ICU camera feed");
  });

  req.pipe(upstreamRequest);
}

module.exports = { proxyIcuCameraFeed };