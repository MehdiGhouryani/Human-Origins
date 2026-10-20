import {defineConfig,devices} from '@playwright/test'

// CI runs against the production build (`next start`), locally against `next dev`.
const prod=Boolean(process.env.CI)
export default defineConfig({
  testDir:'./tests/e2e',
  timeout:45_000,
  expect:{toHaveScreenshot:{maxDiffPixelRatio:0.01,animations:'disabled',caret:'hide'}},
  snapshotPathTemplate:'{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use:{baseURL:'http://localhost:3000',trace:'retain-on-failure',reducedMotion:'reduce',
    // Optional: use a locally installed Chromium when the Playwright browser download is unavailable.
    ...(process.env.PW_CHROMIUM_PATH?{launchOptions:{executablePath:process.env.PW_CHROMIUM_PATH}}:{})},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'phone',use:{...devices['Pixel 7']},testMatch:/(responsive|visual)\.spec\.ts/},
    {name:'iphone-se',use:{...devices['iPhone SE'],browserName:'chromium'},testMatch:/(responsive|visual)\.spec\.ts/},
    {name:'tablet',use:{...devices['iPad Mini'],browserName:'chromium'},testMatch:/(responsive|visual)\.spec\.ts/},
  ],
  webServer:{command:prod?'npm run start':'npm run dev',url:'http://localhost:3000',reuseExistingServer:!prod,timeout:180_000}
})
