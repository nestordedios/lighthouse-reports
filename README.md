# Lighthouse Reports Script

This script automates the generation of Google Lighthouse reports for all pages listed in a website’s sitemap.

It supports analysis for both mobile and desktop devices, organizes the reports based on scores for each report category 
and saves the reports where the score is less than 100, helping to focus on areas needing improvement.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Folder Structure](#folder-structure)

---

## Features

- **Automated Report Generation**: Runs Lighthouse analysis on each page listed in a sitemap.
- **Device Support**: Generates reports for both mobile and desktop views.
- **Score-Based Organization**: Saves reports only for scores below 100, organizing them in folders based on content 
type, category, and score range.

## Prerequisites

- **Node.js**: Version 18 or above.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/lighthouse-sitemap-script.git
   cd lighthouse-sitemap-script
   ```
2. **Install Dependencies**: Run the following command to install required Node packages:
    ```bash
    npm install
    ```
3. **Edit Configuration (optional)**:
   If you need to customize the script (such as setting a custom output directory), you can make adjustments in the 
script file runLighthouseOnSitemap.js. In the future this might be possible to do on a separate configuration file.

## Usage

### Running the Script
To run the script and generate Lighthouse reports, use the following command:

```bash
node runLighthouseOnSitemap.js <sitemap_url>
```
Replace **<sitemap_url>** with the URL of the sitemap you want to analyze. For example:

```bash
node runLighthouseOnSitemap.js https://example.com/sitemap.xml
```

### Folder Structure
Generated reports will be organized in the following structure:

```php
output/
└── YYYY-MM/
    └── <content-type>/
        └── <category>/
            ├── 0-49/
            ├── 50-89/
            └── 90-100/
                ├── <page-slug>_desktop.html
                └── <page-slug>_mobile.html
```

- **YYYY-MM**: The year and month when the report was generated.
- **Content-Type**: Based on the path after the domain in the URL.
- **Category**: The Lighthouse report category (performance, accessibility, bestPractices, seo).
- **Score Range**: Reports are organized into folders named 0-49, 50-89, and 90-100 based on the score achieved. This is
how LightHouse categorizes the scores.
- **Report Files**: Each report is named using the page slug followed by the device type (desktop or mobile).

#### Example
If you analyze https://example.com/posts/article-123 in November 2024, the folder structure will look like this:

```css
output/
    └── 2024-11/
        └── posts/
            └── performance/
                └── 50-89/
                    ├── article-123_desktop.html
                    └── article-123_mobile.html
```
