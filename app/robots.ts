import type {MetadataRoute} from 'next'
import {absoluteUrl} from '../infrastructure/site/url'

// Crawler policy (plan decision 3). The tokens come from each operator's documentation:
// training crawlers are blocked, search and user-triggered retrieval is allowed. User-triggered fetchers may ignore robots.txt
// (OpenAI and Perplexity say so), so this file is a request, not an enforcement.
const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']
const SEARCH_AND_RETRIEVAL = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Googlebot', 'Bingbot', 'Applebot']
const PRIVATE_PATHS = ['/admin', '/api']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {userAgent: '*', allow: '/', disallow: PRIVATE_PATHS},
      {userAgent: SEARCH_AND_RETRIEVAL, allow: '/', disallow: PRIVATE_PATHS},
      ...TRAINING_CRAWLERS.map(userAgent => ({userAgent, disallow: '/'})),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
