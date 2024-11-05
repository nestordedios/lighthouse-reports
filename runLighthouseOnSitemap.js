// Import required modules
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { format } from 'date-fns';

const args = process.argv.slice(2);
const targetUrl = args[0];

// Create a directory for reports if it doesn't exist
const reportsDir = './lighthouse_reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Create an https agent that ignores self-signed certificate errors (Handy when testing on localhost)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Ignore self-signed certificate errors
});

// Function to determine the directory path based on month, content type, category, and score range
function getDirectoryPath(url, category, score) {
  const date = format(new Date(), 'yyyy-MM'); // Current month as "YYYY-MM"
  const [, contentType] = new URL(url).pathname.split('/'); // Content type from the URL

  // Determine score range folder based on score
  const scoreRange = score <= 49 ? '0-49' : score <= 89 ? '50-89' : '90-100';
  const dirPath = path.join(reportsDir, date, contentType, category, scoreRange);

  // Ensure the directory structure exists
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

// Function to generate a safe filename from a URL
function generateFilename(url, formFactor) {
  // Replace slashes with underscores to create a valid filename
  const safeUrlPath = url.replace(/https?:\/\//, '').replace(/\//g, '_');
  return `report_${formFactor}_${safeUrlPath}.html`;
}

// Function to run Lighthouse on a given URL and conditionally save the report
async function runLighthouse(url, formFactor) {
  console.log(`Running Lighthouse (${formFactor}) on ${url}`);

  // Launch Chrome for Lighthouse
  const chrome = await launch({ chromeFlags: ['--headless', '--ignore-certificate-errors'] });

  try {
    // Run Lighthouse
    const result = await lighthouse(url, {
      port: chrome.port,
      output: ['html'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: formFactor,
      screenEmulation: formFactor === 'desktop' ? { disabled: true } : undefined, // Disables mobile emulation for desktop
    });

    // Save report
    await saveLighthouseReport(result, url, formFactor);

  } catch (error) {
    console.error(`Error running Lighthouse on ${url}:`, error.message);
  } finally {
    await chrome.kill();
  }
}

// Function to save report if a category score is below 100
async function saveLighthouseReport(result, url, deviceType) {
  const scores = {
    performance: result.lhr.categories.performance.score * 100,
    accessibility: result.lhr.categories.accessibility.score * 100,
    bestPractices: result.lhr.categories['best-practices'].score * 100,
    seo: result.lhr.categories.seo.score * 100,
  };

  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const urlPath = new URL(url).pathname;
  const contentType = urlPath.split('/')[1] || 'general';
  const slug = urlPath.split('/').pop() || 'index';

  // Loop through each category and save report if score is below 100
  for (const [category, score] of Object.entries(scores)) {
    if (score < 100) {
      const scoreRangeFolder = score < 50 ? '0-49' : score < 90 ? '50-89' : '90-100';
      const reportFolderPath = path.join(
        'output',
        currentMonth,
        contentType,
        category,
        scoreRangeFolder
      );

      // Ensure the directory structure exists
      fs.mkdirSync(reportFolderPath, { recursive: true });

      // Define the report filename with the device type (desktop/mobile) and slug
      const reportFilePath = path.join(reportFolderPath, `${slug}_${deviceType}.html`);

      // Save the report file
      fs.writeFileSync(reportFilePath, result.report[0]);
      console.log(`Saved ${category} report for ${url} with score ${score} at ${reportFilePath}`);
    }
  }
}

// Function to fetch and parse the sitemap XML
async function getSitemapUrls(sitemapUrl) {
  try {
    console.log('sitemapUrl:', sitemapUrl);
    const response = await axios.get(sitemapUrl, { httpsAgent }); // Use the httpsAgent
    const xml = response.data;

    // Parse the XML and extract URLs
    const result = await parseStringPromise(xml);
    const urls = result.urlset.url.map(entry => entry.loc[0]);

    console.log(`Found ${urls.length} URLs in sitemap.`);
    return urls;
  } catch (error) {
    console.error(`Error fetching or parsing sitemap:`, error.message);
    return [];
  }
}

// Main function to orchestrate the process
async function start() {
  console.log('Getting Sitemap...');
  const urls = await getSitemapUrls(targetUrl);

  // Run Lighthouse on each URL from the sitemap
  for (const url of urls) {
    await runLighthouse(url, 'mobile');   // Run mobile analysis
    await runLighthouse(url, 'desktop');  // Run desktop analysis
  }
}

// Start the process
start();
