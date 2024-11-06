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
lighthouse_reports/
└── YYYY-MM/
    └── <content-type>/
        ├── report_desktop_<page-slug>_P<performance-score>_A<accessibility-score>_B<best-practices-score>_S<seo-score>.html
        └── report_mobile_<page-slug>_P<performance-score>_A<accessibility-score>_B<best-practices-score>_S<seo-score>.html
```
lighthouse_reports/2024-11/onze-diensten/report_mobile__onze-diensten_digital-user-experience_user-experience-design_P91_A86_B79_S92.html
- **YYYY-MM**: The year and month when the report was generated.
- **Content-Type**: Based on the path after the domain in the URL.
- **Report Files**: Each report is named using the device type (desktop or mobile) followed by the page slug and report scores .

#### Example
If you analyze https://example.com/posts/article-123 in November 2024, the folder structure will look like this:

```css
output/
└── 2024-11/
    └── posts/
        ├── report_desktop_article-123_P56_A35_B100_S78.html
        └── report_mobile_article-123_P45_A39_B87_S48.html
```
