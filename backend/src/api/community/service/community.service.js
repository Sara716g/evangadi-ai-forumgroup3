/**
 * Strips HTML tags from a string and trims it to a specified length
 */
const cleanExcerpt = (htmlString, maxLength = 200) => {
  if (!htmlString) return '';
  // Remove HTML tags using regex
  const cleanText = htmlString.replace(/<\/?[^>]+(>|$)/g, "");
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
};

/**
 * Fetches search results from external forums (Stack Overflow)
 * @param {string} query - The search term
 * @param {string} forum - The target forum (e.g., 'stackoverflow')
 * @param {number} limit - Maximum number of results to return
 */
export const fetchExternalForumSearch = async (query, forum = 'stackoverflow', limit = 8) => {
  try {
    const targetForum = forum.toLowerCase();
    
    // Validate forum name as per task specifications
    if (targetForum !== 'stackoverflow') {
      throw new Error(`Unsupported forum: '${forum}'. Currently, only 'stackoverflow' is supported.`);
    }

    // StackOverflow Advanced Search API URL configuration
    const url = new URL('https://api.stackexchange.com/2.3/search/advanced');
    url.search = new URLSearchParams({
      q: query,
      site: 'stackoverflow',
      pagesize: String(limit),
      filter: 'withbody' // Standard built-in filter that includes body content
    }).toString();

    // 8-second timeout rule using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error_message || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    // Map and format incoming Stack Overflow data to specified schema
    return items.map(item => ({
      externalId: String(item.question_id),
      title: item.title,
      url: item.link,
      score: item.score,
      answerCount: item.answer_count,
      isAnswered: item.is_answered,
      tags: item.tags || [],
      excerpt: cleanExcerpt(item.body),
      createdAt: new Date(item.creation_date * 1000).toISOString() // Converts UNIX timestamp to ISO format
    }));

  } catch (error) {
    console.error("Error in community.service.js:", error.message);
    if (error.name === 'AbortError') {
      throw new Error("Stack Overflow API request timed out (8-second timeout reached).");
    }
    throw new Error(error.message || "Failed to fetch data from Stack Overflow API.");
  }
};