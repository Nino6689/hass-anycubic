// Stub for the resolver harness. The entity resolver never touches dates;
// bundling the real date-fns would demand node_modules in CI for functions
// no test calls. Anything that DOES call one of these in a test fails
// loudly instead of silently passing on a fake.
const bang = (name) => () => {
  throw new Error(`date-fns stub: ${name} called from the resolver harness`);
};
export const intervalToDuration = bang("intervalToDuration");
export const formatDuration = bang("formatDuration");
export const format = bang("format");
export const addSeconds = bang("addSeconds");
export const differenceInSeconds = bang("differenceInSeconds");
