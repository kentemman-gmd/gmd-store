import os
import xml.etree.ElementTree as ET

def create_plugins_xml(plugins_path):
    # Create the root element
    plugins_elem = ET.Element("plugins")

    # Iterate over each directory in the plugins folder
    for plugin_dir in os.listdir(plugins_path):
        plugin_path = os.path.join(plugins_path, plugin_dir)

        # Check if it's a directory
        if os.path.isdir(plugin_path):
            # Look for the metadata.txt file
            metadata_path = os.path.join(plugin_path, 'metadata.txt')
            zip_file = f"{plugin_dir}.zip"  # Assuming ZIP is named after the directory
            zip_file_path = os.path.join(plugin_path, zip_file)  # Full path to ZIP

            if os.path.exists(metadata_path) and os.path.exists(zip_file_path):
                # Read the metadata
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = {}
                    current_section = None
                    
                    for line in f:
                        line = line.strip()  # Remove any leading/trailing whitespace
                        
                        # Skip empty lines
                        if line == "":
                            continue
                        
                        # Handle sections
                        if line.startswith("[") and line.endswith("]"):
                            current_section = line[1:-1].strip()  # Extract section name
                            continue
                        
                        # Handle key-value pairs
                        if "=" in line:
                            key, value = line.split("=", 1)
                            metadata[key.strip()] = value.strip()
                        else:
                            print(f"Warning: Line '{line}' in {metadata_path} does not contain '='")

                # Create an XML element for this plugin with the desired format
                plugin_elem = ET.SubElement(plugins_elem, "pyqgis_plugin", name=metadata.get("name", plugin_dir), version=metadata.get("version", "0.0"))
                
                ET.SubElement(plugin_elem, "description").text = metadata.get("description", "")
                ET.SubElement(plugin_elem, "about").text = metadata.get("about", "")
                ET.SubElement(plugin_elem, "qgis_minimum_version").text = metadata.get("qgisMinimumVersion", "3.10")
                ET.SubElement(plugin_elem, "homepage").text = metadata.get("homepage", "")
                ET.SubElement(plugin_elem, "file_name").text = zip_file
                ET.SubElement(plugin_elem, "icon").text = metadata.get("icon", "")
                ET.SubElement(plugin_elem, "author").text = metadata.get("author", "")
                ET.SubElement(plugin_elem, "experimental").text = metadata.get("experimental", "False")
                ET.SubElement(plugin_elem, "deprecated").text = metadata.get("deprecated", "False")
                
                # Assuming you want a download URL which can be manually set or derived
                download_url = metadata.get("repository", f"https://github.com/Geotags-GMD/{plugin_dir}/releases/download/v{metadata.get('version', '0.0')}/{zip_file}")
                ET.SubElement(plugin_elem, "download_url").text = download_url

            else:
                print(f"Warning: {plugin_dir} is missing either metadata.txt or {zip_file}")

    # Create the XML tree and write to plugins.xml
    xml_output_path = os.path.join(plugins_path, "plugins.xml")
    tree = ET.ElementTree(plugins_elem)
    tree.write(xml_output_path, encoding="utf-8", xml_declaration=True)

    print(f"plugins.xml has been created at {xml_output_path}")

if __name__ == "__main__":
    # Set the path to the plugins directory
    plugins_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plugins')
    create_plugins_xml(plugins_path)
