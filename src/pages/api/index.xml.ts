import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const xmlPath = path.join(process.cwd(), 'public', 'plugin.xml');
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xmlContent);
}