export default function (
  a: number[],
  b: number[],
  divisions: number,
  cb: (arg0: any[]) => boolean
) {
  let results;
  const x: number = a[0];
  const dx: number = a[0] === b[0] ? 0 : b[0] - a[0];
  const y: number = a[1];
  const dy: number = a[1] === b[1] ? 0 : b[1] - a[1];

  for (let i of Array(divisions)
    .fill(null)
    .map((_, j) => j / divisions)) {
    if (cb([x + i * dx, y + i * dy]) === true) {
      return;
    }
  }
}
