// See https://stackoverflow.com/a/43053803/4444546

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const cartesian = (...a) =>
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
