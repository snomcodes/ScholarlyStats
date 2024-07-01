import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line import/no-unresolved
import { SearchBox } from 'src/components/hero'

export default function Home() {
  const { t } = useTranslation('translation')
  return (
    <>
      <Helmet>
        <title>{t('title')}</title>
      </Helmet>
      <SearchBox />
    </>
  )
}
