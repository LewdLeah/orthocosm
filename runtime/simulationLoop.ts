export const runLoop = <S>(
  stepFn: (state: S) => S,
  renderFn: (state: S) => string,
  initialState: S,
  maxGenerations: number,
  delayMs: number,
) => {
  return async () => {
    let state = initialState;
    for (let gen = 0; gen < maxGenerations; gen++) {
      process.stdout.write(`\x1b[2J\x1b[H`);
      process.stdout.write(`Generation ${gen}\n`);
      process.stdout.write(renderFn(state));
      process.stdout.write(`\n`);
      state = stepFn(state);
      await new Promise<void>((r) => setTimeout(r, delayMs));
    }
  };
};
