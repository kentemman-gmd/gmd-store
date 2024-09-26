"use client"

import { useState, useEffect } from "react"
import { Search, Menu, Puzzle, Box, FileText, Star, Download,  LayoutGrid, Package2} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

interface GMDResource {
  name: string;
  description: string;
  version: string;
  iconUrl: string;
  repoUrl: string;
  category: string;
  features: string[];
  latestUpdate: string;
}

export function ResponsiveResourceDisplayWithResponsiveTitles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [resources, setResources] = useState<GMDResource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categories = [
    { name: "All", icon: LayoutGrid },
    { name: "Plugins", icon: Puzzle },
    { name: "Models", icon: Box },
    { name: "Documents", icon: FileText },
    { name: "Others", icon: Package2 },
  ]

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('https://raw.githubusercontent.com/kentemman-gmd/gmd-plugins/refs/heads/main/gmd-resources.json')
        const data: GMDResource[] = await response.json()
        
        // Fetch latest version for each resource
        const updatedResources = await Promise.all(data.map(async (resource) => {
          const version = await fetchLatestVersion(resource.repoUrl)
          return { ...resource, version }
        }))

        setResources(updatedResources)
      } catch (error) {
        console.error('Error fetching resources:', error)
      }
      setIsLoading(false)
    }

    fetchResources()
  }, [])

  const fetchLatestVersion = async (repoUrl: string): Promise<string> => {
    try {
      const response = await fetch(repoUrl)
      const data = await response.json()
      return data.tag_name || 'Unknown'
    } catch (error) {
      console.error('Error fetching latest version:', error)
      return 'Unknown'
    }
  }

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "All" || resource.category === selectedCategory)
  )

  const handleDownload = async (resource: GMDResource) => {
    try {
      const response = await fetch(resource.repoUrl)
      const releaseData = await response.json()

      if (response.ok) {
        const zipAsset = releaseData.assets.find((asset: { name: string; browser_download_url: string }) => 
          asset.name.endsWith('.zip')
        )

        if (zipAsset) {
          window.open(zipAsset.browser_download_url, "_blank")
        } else {
          console.error('No zip file found in the latest release')
          // You might want to show an error message to the user here
        }
      } else {
        console.error('Failed to fetch latest release:', releaseData.message)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error fetching latest release:', error)
      // You might want to show an error message to the user here
    }
  }

  const Sidebar = ({ className = "" }) => (
    <div className={`p-4 space-y-4 ${className}`}>
      {categories.map((category) => (
        <Button
          key={category.name}
          variant={selectedCategory === category.name ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setSelectedCategory(category.name)}
        >
          <category.icon className="h-5 w-5 mr-2" />
          {category.name}
        </Button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <Sidebar />
              </SheetContent>
            </Sheet>
            <h1 className="text-2xl font-bold ml-2 lg:ml-0">GMD Resources</h1>
          </div>
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              className="w-full bg-gray-100 pl-8 dark:bg-gray-700"
              placeholder="Search resource titles..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar for larger screens */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">{selectedCategory}</h2>
          {isLoading ? (
            <p>Loading resources...</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="bg-white p-1 rounded-lg shadow flex-shrink-0">
                        <Image
                          src={resource.iconUrl}
                          alt={`${resource.name} icon`}
                          width={50}
                          height={50}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate">
                          {resource.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">{resource.version}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{resource.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Key Features:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {resource.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        Latest Update:
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{resource.latestUpdate}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}