"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import dynamic from 'next/dynamic'
import loadingAnimation from "./loading-animation.json"

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

const CATALOG_URL = 'https://raw.githubusercontent.com/kentemman-gmd/gmd-plugins/refs/heads/main/plugin-catalog.json';

interface Plugin {
  name: string;
  description: string;
  version: string;
  iconUrl: string;
  downloadUrl: string;
}

interface PluginCatalogItem {
  name: string;
  repoUrl: string;
  iconUrl: string;
}

function extractPlainTextSummary(markdown: string, maxLength: number = 150): string {
  let plainText = markdown
    .replace(/#+\s/g, '')
    .replace(/(\*|_){1,2}(.+?)\1{1,2}/g, '$2')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/(?:^|\n)[\s]*>[\s]*(.*)/g, '$1')

  plainText = plainText.trim()
  if (plainText.length > maxLength) {
    plainText = plainText.slice(0, maxLength) + '...'
  }

  return plainText
}

export function PluginDisplayWithTitleSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPlugins = async () => {
      try {
        const catalogResponse = await fetch(CATALOG_URL, { signal })
        if (!catalogResponse.ok) {
          throw new Error('Failed to fetch plugin catalog')
        }
        const catalog = await catalogResponse.json()

        const pluginPromises = catalog.plugins.map(async (item: PluginCatalogItem) => {
          const response = await fetch(item.repoUrl, { signal })
          if (!response.ok) {
            throw new Error(`Failed to fetch plugin data for ${item.name}`)
          }
          const releaseData = await response.json()
          
          const zipAsset = releaseData.assets.find((asset: any) => asset.name.endsWith('.zip'))
          if (!zipAsset) {
            throw new Error(`No zip file found for ${item.name}`)
          }

          return {
            name: item.name,
            description: extractPlainTextSummary(releaseData.body),
            version: releaseData.tag_name,
            iconUrl: item.iconUrl,
            downloadUrl: zipAsset.browser_download_url
          } as Plugin
        })

        const pluginsData = await Promise.all(pluginPromises)
        if (!signal.aborted) {
          setPlugins(pluginsData)
          setLoading(false)
        }
      } catch (err) {
        if (!signal.aborted) {
          setError('Failed to load plugins. Please try again later.')
          setLoading(false)
        }
      }
    }

    fetchPlugins()

    return () => {
      controller.abort();
    };
  }, [])

  const filteredPlugins = useMemo(() => 
    plugins.filter(plugin =>
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [plugins, searchTerm]
  )

  const handleDownload = (downloadUrl: string) => {
    window.open(downloadUrl, "_blank")
  }

  if (!isMounted) {
    return null // or a simple loading text
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        {isMounted && (
          <Lottie 
            animationData={loadingAnimation} 
            loop={true}
            style={{ width: 600, height: 200 }}
          />
        )}
        <p className="mt-4 text-lg">Loading plugins...</p>
      </div>
    )
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">GMD Resources</h1>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                className="w-full bg-gray-100 pl-8 dark:bg-gray-700"
                placeholder="Search plugin titles..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-1 rounded-lg shadow">
                      <img
                        src={plugin.iconUrl}
                        alt={`${plugin.name} icon`}
                        width={50}
                        height={50}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <CardTitle>{plugin.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{plugin.version}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 dark:text-gray-400">{plugin.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleDownload(plugin.downloadUrl)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}