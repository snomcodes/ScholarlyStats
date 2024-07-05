import React, { ReactNode } from 'react'
import { LanguageSelector } from '../language-selector'
import { useTranslation } from 'react-i18next'

// TODO - fix react-i18next translations

interface IProps {
  leftNode?: ReactNode
}
export function Header(props: IProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed left-0 top-0 z-10 flex w-full items-center justify-between rounded-b-md border border-neutral-800 bg-neutral-800 bg-opacity-60 px-4 py-4 md:px-12">
      <a href="/" className="text-sm font-semibold text-white md:text-base">
        ScienceStats
      </a>
      <div className="flex items-center gap-2">
        <LanguageSelector />
      </div>
    </div>
  )
}
