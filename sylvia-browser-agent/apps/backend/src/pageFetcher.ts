import * as cheerio from "cheerio";

export interface FetchedPage {
  url: string;
  title?: string;
  content: string;
}

export async function fetchPageContextForUrl(url: string): Promise<FetchedPage> {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const text = $("body").text();
  const MAX_CHARS = 20000;

  return {
    url,
    title,
    content: text.slice(0, MAX_CHARS)
  };
}
