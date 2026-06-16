import { chromium } from "playwright";

const URL = "http://localhost:4317/";
const browser = await chromium.launch();

async function shoot(name, w, h, drive) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  if (drive) await drive(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: false });
  // also capture overflow info
  const info = await page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, scrollH: de.scrollHeight, clientH: de.clientHeight };
  });
  console.log(name, JSON.stringify(info));
  await ctx.close();
}

const begin = async (page) => {
  await page.getByRole("button", { name: /Begin Campaign/i }).click();
  await page.waitForTimeout(600);
};

await shoot("setup-desktop", 1440, 900);
await shoot("game-desktop", 1440, 900, begin);
await shoot("game-laptop", 1100, 800, begin);
await shoot("game-mobile", 375, 812, begin);
await shoot("setup-mobile", 375, 812);

await browser.close();
console.log("done");
