'use client'

import { useState, useEffect } from "react"
import { Search, Download, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define the Plugin interface
interface Plugin {
  id: number;
  name: string;
  type: string;
  image: string;
  description: string;
  latestRelease: string;
  downloadUrl: string;
}

// Define the structure of the data fetched from the JSON file
interface PluginData {
  name: string;
  category: string;
  iconUrl: string;
  description: string;
  latestUpdate: string;
  repoUrl: string;
}

function PluginCard({ plugin, onClick }: { plugin: Plugin; onClick: () => void }) {
  return (
    <Card className="cursor-pointer transition-transform hover:scale-105" onClick={onClick}>
      <CardHeader className="p-0">
        <img src={plugin.image} alt={plugin.name} className="w-full h-40 object-cover rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-1">{plugin.name}</CardTitle>
        {/* <CardDescription className="text-sm text-gray-500 mb-2">{plugin.type}</CardDescription> */}
        {/* <p className="text-xs text-gray-600">Latest: {plugin.latestRelease || "N/A"} </p> */}
      </CardContent>
    </Card>
  )
}

function PluginGrid({ plugins, onPluginClick }: { plugins: Plugin[]; onPluginClick: (plugin: Plugin) => void }) {
  if (plugins.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-gray-600">No plugins found</p>
        <p className="text-sm text-gray-500">Try adjusting your search</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.id} plugin={plugin} onClick={() => onPluginClick(plugin)} />
      ))}
    </div>
  )
}

export function GmdPlugin() {
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const repoLink = "https://gmd-plugin.vercel.app/api/index.xml"
  const { toast } = useToast()

  const fetchPlugins = async () => {
    try {
      // Check if the cached data exists in localStorage
      const cachedData = localStorage.getItem("pluginData");
      const cachedReleaseDate = localStorage.getItem("pluginReleaseDate");
      const currentTime = new Date().getTime();
  
      // If cached data exists and it's not expired (cache expires in 5 minutes)
      if (cachedData && cachedReleaseDate && currentTime - parseInt(cachedReleaseDate) < 60000) {
        console.log("Using cached plugin data.");
        setPlugins(JSON.parse(cachedData)); // Use cached data
        return;
      }
  
      // Fetch plugin data from the server if no valid cache exists or cache has expired
      const response = await fetch(
        "https://raw.githubusercontent.com/kentemman-gmd/gmd-plugins/refs/heads/main/gmd-resources.json"
      );
      const data: PluginData[] = await response.json();
  
      const plugins = await Promise.all(
        data.map(async (plugin: PluginData, index: number) => {
          let downloadUrl = plugin.repoUrl; // Fallback to repo URL
          let latestRelease = "N/A"; // Default value if release is unavailable
  
          // Check if the repo URL is a GitHub repository
          if (plugin.repoUrl.includes("github.com")) {
            const apiUrl = plugin.repoUrl
              .replace("https://github.com", "https://api.github.com/repos")
              .replace(/\/releases\/latest$/, "") + "/releases/latest";
  
            try {
              const releaseResponse = await fetch(apiUrl);
              const releaseData = await releaseResponse.json();
  
              if (releaseData.tag_name) {
                latestRelease = releaseData.tag_name; // Use tag_name if available
                downloadUrl =
                  releaseData.assets?.[0]?.browser_download_url || downloadUrl; // Extract from assets
              } else {
                console.warn(`No tag_name found for ${plugin.name}.`);
                latestRelease = "Tag not available"; // Indicate missing tag_name
              }
            } catch (error) {
              console.warn(`Failed to fetch release for ${plugin.name}:`, error);
              latestRelease = "Error fetching version name"; // Fallback error message
            }
          }
  
          return {
            id: index,
            name: plugin.name,
            type: plugin.category,
            image: plugin.iconUrl,
            description: plugin.description,
            latestRelease,
            downloadUrl,
          };
        })
      );
  
      // Cache the plugin data and release date
      localStorage.setItem("pluginData", JSON.stringify(plugins));
      localStorage.setItem("pluginReleaseDate", currentTime.toString());
  
      setPlugins(plugins); // Use newly fetched data
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };
  
  

  useEffect(() => {
    fetchPlugins()
  }, []) // Empty dependency array to run only once

  const handlePluginClick = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(repoLink).then(() => {
      setIsCopied(true)
      toast({
        title: "Link copied!",
        description: "The repository link has been copied to your clipboard.",
      })
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  // Update search query directly in the input's onChange
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredPlugins = plugins.filter((plugin) => {
    return (
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleDownload = async (resource: Plugin) => { // Updated parameter type to Plugin
    try {
      const response = await fetch(resource.downloadUrl) // Use the downloadUrl from the Plugin
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">GMD Plugin</h1>
        </div>
      </header>
      <main className="flex-grow overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-4">
            Explore and download the GMD plugin collection designed to accelerate your geospatial workflow.
            </p>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-xl">Repository Link</CardTitle>
                <CardDescription>Copy the link to access the GMD Plugin repository</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  value={repoLink}
                  readOnly
                  className="flex-grow"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto"
                >
                  {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>
              </CardContent>
            </Card>
            <div className="relative">
              <Input
                type="search"
                placeholder="Search plugins"
                value={searchQuery}
                onChange={handleSearchChange} // Directly set the search query
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
          <PluginGrid plugins={filteredPlugins} onPluginClick={handlePluginClick} />
        </div>
      </main>
      <Dialog open={!!selectedPlugin} onOpenChange={() => setSelectedPlugin(null)}>
        <DialogContent className="max-w-3xl">
          {selectedPlugin && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedPlugin.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <img
                  src={selectedPlugin.image}
                  alt={selectedPlugin.name}
                  className="w-full aspect-square object-cover rounded-md col-span-1"
                />
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-lg font-semibold text-gray-700 mb-2">{selectedPlugin.type}</p>
                  <p className="text-base text-gray-600 mb-4">{selectedPlugin.description}</p>
                  <p className="text-sm text-gray-500 mb-4">Version: {selectedPlugin.latestRelease}</p>
                  {/* <Button className="w-full" onClick={() => window.open(selectedPlugin.downloadUrl, "_blank")} >
                    <a href={selectedPlugin.downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full flex justify-center">
                      <Download className="mr-2" />
                      Download
                    </a>
                  </Button> */}
                 <Button className="w-full" onClick={() => handleDownload(selectedPlugin)} asChild>
                    <a className="flex items-center justify-center">
                      <Download className="w-5 h-5 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
