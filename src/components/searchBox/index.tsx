import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

// TODO shorten screen height

interface ArxivResult {
  title: string
  author: string
  link: string
}

export const SearchBox: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArxivResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchResults = useCallback(async (searchQuery: string) => {
    try {
      const response = await axios.get(
        `http://export.arxiv.org/api/query?search_query=all:${searchQuery}&start=0&max_results=10`,
      )
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      const entries = xml.getElementsByTagName('entry')
      const resultsArray: ArxivResult[] = []
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const title = entry.getElementsByTagName('title')[0]?.textContent
        const link = entry.getElementsByTagName('id')[0]?.textContent
        const author = entry.getElementsByTagName('author')[0]?.textContent

        if (title && link && author) {
          resultsArray.push({ title, link, author })
        }
      }
      return resultsArray
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }, [])

  const fetchRecentPapers = useCallback(async () => {
    try {
      const ARXIV_API =
        'http://export.arxiv.org/api/query?search_query=all&sortBy=submittedDate&sortOrder=descending&max_results=10'
      const response = await axios.get(ARXIV_API)
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      if (xml.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML')
      }
      const entries = xml.getElementsByTagName('entry')
      const resultsArray: ArxivResult[] = []
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const title = entry.getElementsByTagName('title')[0]?.textContent
        const link = entry.getElementsByTagName('id')[0]?.textContent
        const author = entry.getElementsByTagName('author')[0]?.textContent

        if (title && link && author) {
          resultsArray.push({ title, link, author })
        }
      }
      setResults(resultsArray)
      console.log('Fetched recent papers:', resultsArray)
    } catch (error) {
      console.error('Error fetching recent papers:', error)
    }
  }, [])

  useEffect(() => {
    fetchRecentPapers()
  }, [fetchRecentPapers])

  const searchArxiv = async () => {
    setIsLoading(true)
    setResults([])
    const newResults = await fetchResults(query)
    setResults(newResults)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 p-2">
      <div className="my-16 rounded-md bg-neutral-800 py-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query"
            className="w-full flex-grow rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
          />
          <button
            className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 sm:w-auto"
            onClick={searchArxiv}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>
      <div
        className="mt-[-50px] h-screen flex-grow overflow-y-auto rounded-md bg-neutral-800"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="container mx-auto px-4 py-4">
          {results.map((result, index) => (
            <div key={index} className="mb-4 rounded-md bg-neutral-900 p-4 shadow-md">
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {result.title}
              </a>
              <p className="mt-2 text-sm text-gray-400">{result.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
