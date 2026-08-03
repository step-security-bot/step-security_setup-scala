import { install } from "../src/install";

test("install", async () => {
  await install("adopt@1.8", "0.11.2");
});
