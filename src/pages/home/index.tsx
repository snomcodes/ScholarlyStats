import { Helmet } from 'react-helmet'
// eslint-disable-next-line import/no-unresolved
import { SearchBox } from 'src/components/searchBox/index'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ScholarlyStats</title>
      </Helmet>
      <SearchBox />
    </>
  )
}
