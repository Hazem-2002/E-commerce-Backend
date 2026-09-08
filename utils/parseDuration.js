const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error("Invalid duration format");
  }

  const value = Number(match[1]);
  const unit = match[2];

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * units[unit];
};

module.exports = parseDuration;
