import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'

// TODO add more api results
// TODO add categories
// TODO add summary popover
// TODO add direct PDF link
interface ArxivResult {
  title: string
  author: string
  link: string
}

export const SearchBox: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArxivResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [recentResults, setRecentResults] = useState<ArxivResult[]>([])
  const [recentPage, setRecentPage] = useState(0)
  const [hasMoreRecent, setHasMoreRecent] = useState(true)
  const [showRecent, setShowRecent] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchResults = useCallback(async (searchQuery: string, pageNumber: number) => {
    try {
      const response = await axios.get(
        `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery)}&start=${
          pageNumber * 10
        }&max_results=10`,
      )
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      const entries = xml.getElementsByTagName('entry')
      return Array.from(entries).map((entry) => ({
        title: entry.getElementsByTagName('title')[0]?.textContent ?? '',
        link: entry.getElementsByTagName('id')[0]?.textContent ?? '',
        author: entry.getElementsByTagName('author')[0]?.textContent ?? '',
      }))
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }, [])

  const fetchRecentPapers = useCallback(async (pageNumber: number) => {
    try {
      const response = await axios.get(
        `https://export.arxiv.org/api/query?search_query=all&sortBy=submittedDate&sortOrder=descending&start=${
          pageNumber * 10
        }&max_results=10`,
      )
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      if (xml.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML')
      }
      const entries = xml.getElementsByTagName('entry')
      return Array.from(entries).map((entry) => ({
        title: entry.getElementsByTagName('title')[0]?.textContent ?? '',
        link: entry.getElementsByTagName('id')[0]?.textContent ?? '',
        author: entry.getElementsByTagName('author')[0]?.textContent ?? '',
      }))
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }, [])

  const loadMoreRecentResults = useCallback(async () => {
    if (isLoading || !hasMoreRecent) return
    setIsLoading(true)
    const newResults = await fetchRecentPapers(recentPage)
    setRecentResults((prevResults) => [...prevResults, ...newResults])
    setIsLoading(false)
    setHasMoreRecent(newResults.length === 10)
    setRecentPage((prevPage) => prevPage + 1)
  }, [fetchRecentPapers, recentPage, isLoading, hasMoreRecent])

  const loadMoreResults = async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    const newResults = await fetchResults(query, page)
    setResults((prevResults) => [...prevResults, ...newResults])
    setIsLoading(false)
    setHasMore(newResults.length === 10)
    setPage((prevPage) => prevPage + 1)
  }

  const searchArxiv = async () => {
    setIsLoading(true)
    setPage(1)
    setResults([])
    setHasMore(true)
    setShowRecent(false)
    const newResults = await fetchResults(query, 0)
    setResults(newResults)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!initialLoadComplete) {
      loadMoreRecentResults().then(() => setInitialLoadComplete(true))
    }
  }, [loadMoreRecentResults, initialLoadComplete])

  return (
    <div className="flex h-screen flex-col bg-neutral-950 p-2">
      <div className="mb-4 mt-16 rounded-md bg-neutral-800 py-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchArxiv()
              }
            }}
            placeholder={'Enter search query'}
            className="w-full flex-grow rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
          />
          <button
            className="w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 sm:w-auto"
            onClick={searchArxiv}
            disabled={isLoading || query.trim() === ''}
          >
            {'Search'}
          </button>
        </div>
      </div>
      <div id="scrollableDiv" className="flex-grow overflow-y-auto rounded-md bg-neutral-800">
        <InfiniteScroll
          dataLength={showRecent ? recentResults.length : results.length}
          next={showRecent ? loadMoreRecentResults : loadMoreResults}
          hasMore={(showRecent ? hasMoreRecent : hasMore) && !isLoading}
          scrollableTarget="scrollableDiv"
          loader={<h4 className="text-center text-white">Loading...</h4>}
          className="container mx-auto px-4 py-4"
        >
          {(showRecent ? recentResults : results).map((result, index) => (
            <div key={index} className="mb-4 rounded-md bg-neutral-900 p-4 shadow-md">
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {result.title}
              </a>
              <p className="mt-2 text-sm text-gray-400">{result.author}</p>
            </div>
          ))}
        </InfiniteScroll>
      </div>
    </div>
  )
}
