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

// Function to determine the directory path based on month, content type and score range
function getDirectoryPath(url) {
  const date = format(new Date(), 'yyyy-MM'); // Current month as "YYYY-MM"
  const [, contentType] = new URL(url).pathname.split('/'); // Content type from the URL

  const dirPath = path.join(reportsDir, date, contentType);

  // Ensure the directory structure exists
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

// Function to generate a safe filename from a URL
function generateFilename(url, deviceType, scores) {
  const { performance, accessibility, bestPractices, seo } = scores;

  // Format the filename with scores, device type, and URL path
  const baseName = new URL(url).pathname.replace(/\//g, '_');
  const filename = `report_${deviceType}_${baseName}_P${performance}_A${accessibility}_B${bestPractices}_S${seo}.html`;

  return filename;
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

  // Check if any score is below 100
  const isAnyScoreBelow100 = Object.values(scores).some(score => score < 100);

  if (isAnyScoreBelow100) {
    const baseFolder = getDirectoryPath(url);
    // const baseFolder = path.join(process.cwd(), `${contentType}`, deviceType);

    // Create directories if they don’t exist
    fs.mkdirSync(baseFolder, { recursive: true });

    // Generate a unique file name with URL and device type
    const fileName = generateFilename(url, deviceType, scores);
    const filePath = path.join(baseFolder, fileName);

    // Write report to file
    fs.writeFileSync(filePath, result.report[0], 'utf-8');
    console.log(`Report saved: ${filePath}`);
  } else {
    console.log(`All scores are 100. No report generated for ${url} on ${deviceType}.`);
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
