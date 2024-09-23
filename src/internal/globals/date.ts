declare global {
  interface DateConstructor {
    unix(): number;
  }
}

Object.defineProperty(Date, "unix", {
  value: () => Math.floor(Date.now() / 1000),
  writable: false,
});
