import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  // Wait a bit for animations
  await new Promise(r => setTimeout(r, 2000));
  
  const rects = await page.evaluate(() => {
    const sections = document.querySelectorAll('section');
    return Array.from(sections).map(s => ({
      className: s.className,
      rect: s.getBoundingClientRect()
    }));
  });
  console.log("Landing Pages Sections:", rects);

  await page.goto('http://localhost:5173/home');
  await new Promise(r => setTimeout(r, 2000));
  
  const homeElements = await page.evaluate(() => {
    const main = document.querySelector('.flex-1');
    const children = Array.from(main.children);
    return children.map(c => ({
      className: c.className,
      rect: c.getBoundingClientRect()
    }));
  });
  console.log("Home Page Children:", homeElements);

  await browser.close();
})();
