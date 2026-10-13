const http = require('http');
const fs = require('fs');

function testUrl(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        resolve({
          path: urlPath,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          length: Buffer.concat(data).length
        });
      });
    }).on('error', (err) => {
      resolve({ path: urlPath, statusCode: 0, error: err.message });
    });
  });
}

async function validate() {
  console.log('--- VALIDATING FEEDBIRD CLONE ---');

  const html = fs.readFileSync('index.html', 'utf8');

  // Extract all src and href from index.html
  const srcList = [...html.matchAll(/src=["']([^"']+)["']/g)].map(m => m[1]);
  const hrefList = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);

  const internalAssets = [...new Set([...srcList, ...hrefList])]
    .filter(u => u.startsWith('/') && !u.startsWith('//'))
    .sort();

  console.log(`Found ${internalAssets.length} unique internal assets/links on homepage.`);

  let passed = 0;
  let failed = 0;

  for (const asset of internalAssets) {
    const res = await testUrl(asset);
    if (res.statusCode === 200) {
      passed++;
    } else {
      failed++;
      console.error(`FAILED: ${asset} -> Status ${res.statusCode} ${res.error || ''}`);
    }
  }

  console.log(`Homepage Asset Test Results: ${passed} passed, ${failed} failed.`);

  // Test subpages
  const subpages = [
    '/pricing/', '/examples/', '/reviews/', '/about/', '/compare/',
    '/case-studies/', '/book-demo/', '/reseller/', '/social-media-management/',
    '/short-form-video/', '/instagram-growth/', '/ugc-videos/', '/ad-creative/',
    '/ppc-services/', '/meta-ads-management/', '/google-ads-management/',
    '/seo-services/', '/seo-blog-posts/', '/seo-backlinks/', '/managed-seo/',
    '/email-design/', '/conversion-tracking/', '/landing-pages/', '/pro/',
    '/all-services/', '/privacy/', '/terms/', '/refund/', '/video-demo/'
  ];

  let subPassed = 0;
  let subFailed = 0;
  for (const page of subpages) {
    const res = await testUrl(page);
    if (res.statusCode === 200) {
      subPassed++;
    } else {
      subFailed++;
      console.error(`Subpage FAILED: ${page} -> Status ${res.statusCode}`);
    }
  }

  console.log(`Subpage Route Test Results: ${subPassed} passed, ${subFailed} failed.`);
}

validate();
