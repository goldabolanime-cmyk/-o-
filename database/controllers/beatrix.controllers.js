const fs = require("fs-extra");
const path = require("path");

const BEATRIX_PATH = path.join(process.cwd(), "database", "data", "beatrix.json");

function loadBeatrix() {
  try {
    fs.ensureDirSync(path.dirname(BEATRIX_PATH));
    if (!fs.existsSync(BEATRIX_PATH)) fs.writeFileSync(BEATRIX_PATH, "{}");
    return JSON.parse(fs.readFileSync(BEATRIX_PATH, "utf8") || "{}");
  } catch {
    return {};
  }
}

function saveBeatrix(data) {
  try {
    fs.ensureDirSync(path.dirname(BEATRIX_PATH));
    fs.writeFileSync(BEATRIX_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("[BEATRIX ERROR]", e.message);
  }
}

function addUserBeatrix(uid, amount) {
  const data = loadBeatrix();
  if (!data[uid]) data[uid] = 0;
  data[uid] += Number(amount) || 0;
  saveBeatrix(data);
  return data[uid];
}

function getUserBeatrix(uid) {
  const data = loadBeatrix();
  return data[String(uid)] || 0;
}

function setUserBeatrix(uid, amount) {
  const data = loadBeatrix();
  data[String(uid)] = Number(amount) || 0;
  saveBeatrix(data);
  return data[String(uid)];
}

function removeUserBeatrix(uid, amount) {
  const data = loadBeatrix();
  if (!data[String(uid)]) data[String(uid)] = 0;
  data[String(uid)] = Math.max(0, data[String(uid)] - (Number(amount) || 0));
  saveBeatrix(data);
  return data[String(uid)];
}

module.exports = {
  addUserBeatrix,
  getUserBeatrix,
  setUserBeatrix,
  removeUserBeatrix
};
