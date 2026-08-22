const UNSPLASH_IDS: Record<string, string> = {
  Paris: '1511739001486-6bfe10ce785f',
  London: '1486299267070-83823f5448dd',
  Dubai: '1651467606797-e1c660cf3fda',
  Tokyo: '1542051841857-5f90071e7989',
  Mumbai: '1598434192043-71111c1b3f41',
  Delhi: '1571893652827-a3e071ab463b',
  Goa: '1652820330085-82a0c2b88d78',
  Jaipur: '1603262110263-fb0112e7cc33',
  Singapore: '1620033263019-f2ec2c738a60',
  'New York': '1496588152823-86ff7695e68f',
}

export const HERO_IMAGE_ID = '1703705631987-ade8c9bbb09d'

export function unsplash(id: string, width = 1200, quality = 70): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=${quality}`
}

export function cityImage(city: string, width = 900): string {
  const id = UNSPLASH_IDS[city]
  if (id) return unsplash(id, width)
  return `https://picsum.photos/seed/${encodeURIComponent(city)}/${width}/${Math.round(width * 0.66)}`
}

export function heroImage(width = 1600): string {
  return unsplash(HERO_IMAGE_ID, width)
}

export function placeholderImage(seed: string, width = 900, height = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`
}
