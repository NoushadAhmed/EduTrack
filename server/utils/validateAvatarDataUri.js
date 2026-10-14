const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

module.exports = (value) => {
  if (typeof value !== "string") return false;
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;

  const encoded = match[2];
  const buffer = Buffer.from(encoded, "base64");
  if (
    buffer.length === 0 ||
    buffer.length > MAX_AVATAR_BYTES ||
    buffer.toString("base64") !== encoded
  ) {
    return false;
  }

  const isPng =
    match[1] === "png" &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg =
    match[1] === "jpeg" &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  return isPng || isJpeg;
};
