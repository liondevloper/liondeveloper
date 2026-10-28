# Lion Digital Solution: search engine setup

Official site: https://liondigitalsolution.com/

## 1. Google Search Console
1. Open https://search.google.com/search-console and click Add property.
2. Choose Domain and enter `liondigitalsolution.com`.
3. Google shows a TXT record. Add it in your domain's DNS settings (where you bought the domain, or Vercel DNS if the domain uses Vercel nameservers).
4. Wait a few minutes, then click Verify.

## 2. Submit the sitemap
Search Console > Sitemaps > enter `sitemap.xml` > Submit. Status should become Success.

## 3. Inspect and request indexing
Paste `https://liondigitalsolution.com/` in the URL Inspection bar at the top > Test live URL > Request indexing. Check that "User-declared canonical" is `https://liondigitalsolution.com/`.

## 4. Bing Webmaster Tools
Open https://www.bing.com/webmasters, sign in and choose Import from Google Search Console (fastest), or add the site and verify with the DNS record Bing gives you. Then submit `https://liondigitalsolution.com/sitemap.xml` under Sitemaps.

## 5. Validate structured data
- https://search.google.com/test/rich-results with the homepage URL. The Organization should be detected with no errors.
- https://validator.schema.org for a full Schema.org check.

## 6. Check canonical, robots and sitemap
Open these in a browser after deploying:
- https://liondigitalsolution.com/robots.txt (shows the rules and the sitemap line)
- https://liondigitalsolution.com/sitemap.xml (shows one URL)
- https://liondigitalsolution.com/llms.txt
- View page source of the homepage and look for `rel="canonical"`.

Make sure only one version of the site is live: in Vercel > Project > Settings > Domains, set `liondigitalsolution.com` as the main domain and redirect `www.liondigitalsolution.com` and the old `*.vercel.app` address to it.

## 7. Monitor
- Search Console > Pages: indexing problems.
- Search Console > Performance: searches, clicks and position.
- Bing Webmaster Tools > Search Performance.
Check once a week for the first month, then monthly.

## 8. AI search discoverability
There is no submit button for AI assistants and inclusion is never guaranteed. What helps:
- Being indexed in Google and Bing (many AI tools read these).
- Consistent name, website and contact details on the website, Instagram, Facebook and Google Business Profile.
- Now and then, ask ChatGPT, Gemini, Perplexity or Copilot "What is Lion Digital Solution?" and see whether it finds the site.
