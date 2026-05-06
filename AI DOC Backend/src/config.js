const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:4001",
  "http://127.0.0.1:4001",
  "https://intellicure.io",
  "https://www.intellicure.io",
  "http://intellicure.io",
  "http://www.intellicure.io",
];

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const WHEREBY_API_BASE_URL = "https://api.whereby.dev/v1";
const WHEREBY_API_KEY = process.env.WHEREBY_API_KEY;
const PORT = process.env.PORT || 4002;

const allowedIds = {
  doctor: new Set(["deepak-kumar-sahoo", "aditya-ray"]),
  ward: new Set(["ward-1", "ward-2"]),
};
const allowedRoles = new Set(Object.keys(allowedIds));

module.exports = {
  ALLOWED_ORIGINS,
  WHEREBY_API_BASE_URL,
  WHEREBY_API_KEY,
  PORT,
  allowedIds,
  allowedRoles,
};
