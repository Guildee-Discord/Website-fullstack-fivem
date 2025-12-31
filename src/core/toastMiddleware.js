function toast(req, res, next) {
  if (!req.session.toasts) req.session.toasts = [];

  res.toast = (type, message) => {
    req.session.toasts.push({ type, message });
  };

  res.locals.toasts = req.session.toasts;
  req.session.toasts = [];

  next();
}

module.exports = toast;