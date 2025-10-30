function ok(res, data = {}, meta = {}) {
  return res.json({ success: true, data, meta });
}
function created(res, data = {}, meta = {}) {
  return res.status(201).json({ success: true, data, meta });
}
function badRequest(res, message = 'Bad Request') {
  return res.status(400).json({ success: false, error: message });
}
module.exports = { ok, created, badRequest };
