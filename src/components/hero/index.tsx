import React, { useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

// TODO add mutli-page results
// TODO add translations
// TODO add default recent uploads
interface ArxivResult {
  title: string
  author: string
  link: string
}

export const SearchBox = () => {
  const { t } = useTranslation()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArxivResult[]>([])

  const searchArxiv = async () => {
    try {
      const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
          search_query: query,
          start: 0,
          max_results: 20,
        },
      })
      const parser = new DOMParser()
      const xml = parser.parseFromString(response.data, 'text/xml')
      const entries = xml.getElementsByTagName('entry')
      const resultsArray: ArxivResult[] = []
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        resultsArray.push({
          title: entry.getElementsByTagName('title')[0].textContent || '',
          author: entry.getElementsByTagName('author')[0].textContent || '',
          link: entry.getElementsByTagName('id')[0].textContent || '',
        })
      }
      setResults(resultsArray)
    } catch (error) {
      console.log('Error fetching data: ', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 p-2">
      <div className="my-16 rounded-md bg-neutral-800 py-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center  justify-center gap-2 sm:flex-row">
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
          >
            Search
          </button>
        </div>
      </div>
      <div className="mt-[-50px] h-screen flex-grow overflow-y-auto rounded-md bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <ul className="mx-auto w-full max-w-2xl overflow-hidden">
            {results.map((result, index) => (
              <li key={index} className="mb-4 rounded-md bg-neutral-900 p-4 shadow-md">
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.title}
                </a>
                <p className="mt-1 text-sm text-gray-400">{result.author}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
