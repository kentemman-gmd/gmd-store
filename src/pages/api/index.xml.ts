import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const xmlPath = path.join(process.cwd(), 'public', 'index.xml');
  
  try {
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xmlContent);
  } catch (error) {
    console.error('Error reading plugin.xml:', error);
    res.status(500).send('Error reading plugin.xml');
  }
}
