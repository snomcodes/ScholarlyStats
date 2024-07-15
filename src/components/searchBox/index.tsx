import React, { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

// TODO add more api results
// TODO add categories
interface ArxivResult {
  title: string
  authors: string[]
  summary: string
  published: string
  link: string
  query?: string
  page?: number
}

export const SearchBox: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArxivResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showCat, setShowCat] = useState(false)

  const [recentResults, setRecentResults] = useState<ArxivResult[]>([])
  const [recentPage, setRecentPage] = useState(0)
  const [hasMoreRecent, setHasMoreRecent] = useState(true)
  const [showRecent, setShowRecent] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchResults = useCallback(async (searchQuery: string, pageNumber: number): Promise<ArxivResult[]> => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery)}&start=${
          pageNumber * 10
        }&max_results=10`,
      )
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      const entries = xml.getElementsByTagName('entry')
      const papers: ArxivResult[] = Array.from(entries)
        .map((entry) => {
          const getTextContent = (tagName: string) => {
            const element = entry.getElementsByTagName(tagName)[0]
            return element?.textContent || ''
          }
          const authors = Array.from(entry.getElementsByTagName('author'))
            .map((authorNode) => authorNode.textContent || 'Unknown Author')
            .slice(0, 3)
          return {
            title: getTextContent('title'),
            link: getTextContent('id'),
            authors,
            summary: getTextContent('summary'),
            published: getTextContent('published'),
          }
        })
        .filter((paper) => paper.title && paper.link)
      setHasMore(papers.length === 10)
      return papers
    } catch (error) {
      console.error(error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchRecentResults = useCallback(async (pageNumber: number): Promise<ArxivResult[]> => {
    setIsLoading(true)
    try {
      const response = await axios.get(
        `https://export.arxiv.org/api/query?search_query=all&sortBy=submittedDate&sortOrder=descending&start=${
          pageNumber * 10
        }&max_results=10`,
      )
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      const entries = xml.getElementsByTagName('entry')
      const papers: ArxivResult[] = Array.from(entries)
        .map((entry) => {
          const getTextContent = (tagName: string) => {
            const element = entry.getElementsByTagName(tagName)[0]
            return element?.textContent || ''
          }
          const authors = Array.from(entry.getElementsByTagName('author'))
            .map((authorNode) => authorNode.textContent || 'Unknown Author')
            .slice(0, 3)
          return {
            title: getTextContent('title'),
            link: getTextContent('id'),
            authors,
            summary: getTextContent('summary'),
            published: getTextContent('published'),
          }
        })
        .filter((paper) => paper.title && paper.link)
      setHasMore(papers.length === 10)
      return papers
    } catch (error) {
      console.error(error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMoreRecentResults = useCallback(async () => {
    if (isLoading || !hasMoreRecent) return
    setIsLoading(true)
    const newResults = await fetchRecentResults(recentPage)
    setRecentResults((prevResults) => [...prevResults, ...newResults])
    setIsLoading(false)
    setHasMoreRecent(newResults.length === 10)
    setRecentPage((prevPage) => prevPage + 1)
  }, [fetchRecentResults, recentPage, isLoading, hasMoreRecent])

  const loadMoreResults = async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    const newResults = await fetchResults(query, page)
    setResults((prevResults) => [...prevResults, ...newResults])
    setIsLoading(false)
    setHasMore(newResults.length === 10)
    setPage((prevPage) => prevPage + 1)
  }

  const searchArxiv = useCallback(
    async (searchQuery: string) => {
      setIsLoading(true)
      setPage(1)
      setResults([])
      setHasMore(true)
      setShowRecent(false)
      const newResults = await fetchResults(searchQuery, 0)
      setResults(newResults)
      setIsLoading(false)
    },
    [fetchResults],
  )

  useEffect(() => {
    if (!initialLoadComplete) {
      loadMoreRecentResults().then(() => setInitialLoadComplete(true))
    }
  }, [loadMoreRecentResults, initialLoadComplete])

  const handleCategoryClick = useCallback(
    (category: string) => {
      setQuery(category)
      searchArxiv(category)
      setShowCat(false)
    },
    [searchArxiv],
  )

  return (
    <div className="flex h-screen flex-col bg-neutral-950 p-2 lg:w-screen lg:items-center lg:justify-center">
      <div className="relative mb-2 mt-[14%] rounded-md bg-neutral-800 px-2 py-3 shadow-md lg:mt-14 lg:h-auto lg:w-[1/3] lg:px-0 lg:py-2">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 sm:flex-row lg:mx-auto lg:flex-col lg:gap-3 ">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchArxiv(query)
              }
            }}
            placeholder={'Enter search query'}
            className="w-full flex-grow rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto lg:w-[50%]"
          />
          {/* Search button */}
          <button
            className="w-full rounded-md bg-blue-800 px-4 py-2 font-bold text-white hover:bg-blue-700 sm:w-auto lg:w-[25%]"
            onClick={() => searchArxiv(query)}
            disabled={isLoading || query.trim() === ''}
          >
            Search
          </button>
          {/* Category Buttons */}
          <div className="relative w-full sm:w-auto">
            <button
              className="flex w-full items-center justify-between rounded-md bg-neutral-900 p-2 text-center text-gray-300 sm:w-auto lg:mx-auto lg:w-[25%]"
              onClick={() => setShowCat(!showCat)}
            >
              <span className="ml-5 flex-grow">Categories</span>
              {showCat ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
            </button>
            <div
              className={`mt-1 overflow-hidden rounded-md bg-neutral-800 transition-all duration-300 ease-in-out ${
                showCat ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex flex-wrap gap-3 p-3">
                {[
                  'Physics',
                  'Mathematics',
                  'Biology',
                  'Computer Science',
                  'Finance',
                  'Statistics',
                  'Electrical Engineering',
                  'Economics',
                ].map((category) => (
                  <button
                    key={category}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-sm text-white transition-colors duration-200 hover:bg-neutral-500"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="relative flex-grow overflow-hidden rounded-md bg-neutral-800 lg:w-[calc(100vw-300px)]"
        style={{ height: 'calc(100vh - 130px)', width: 'w-[calc(100vw-17px)]' }}
      >
        {/* Inifinite Scroll */}
        <div id="scrollableDiv" className="absolute inset-0 h-full w-full overflow-y-auto rounded-md bg-neutral-800">
          <InfiniteScroll
            dataLength={showRecent ? recentResults.length : results.length}
            next={showRecent ? loadMoreRecentResults : loadMoreResults}
            hasMore={(showRecent ? hasMoreRecent : hasMore) && !isLoading}
            scrollableTarget="scrollableDiv"
            loader={<h4 className="text-center text-white">Loading...</h4>}
            className="container mx-auto h-full px-4 py-4 transition-all duration-300 ease-in-out"
          >
            {(showRecent ? recentResults : results).map((result, index) => (
              <div key={index} className="mb-4 rounded-md bg-neutral-900 p-4 shadow-md lg:text-sm">
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.title}
                </a>
                <p className="mt-2 text-sm text-gray-500 lg:text-xs">{result.authors}</p>
              </div>
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </div>
  )
}

export default SearchBox
