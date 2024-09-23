declare global {
  interface Console {
    json(v: any): void;
  }
}

Object.defineProperty(console, "json", {
  value: function (v: any) {
    console.log(JSON.stringify(v, null, 2));
  },
});
