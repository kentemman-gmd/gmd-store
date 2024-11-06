import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const xmlUrl = 'https://raw.githubusercontent.com/kentemman-gmd/Plugin_OnDev/refs/heads/main/plugin.xml';

  try {
    const response = await fetch(xmlUrl);

    if (!response.ok) {
      throw new Error(`Error fetching XML: ${response.statusText}`);
    }

    const xmlContent = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xmlContent);
  } catch (error) {
    console.error('Error fetching plugin.xml:', error);
    res.status(500).send('Error fetching plugin.xml');
  }
}
