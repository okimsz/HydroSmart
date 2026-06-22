// Crop image mapping (reusing existing assets in public/images)
export const CROP_IMAGES = {
  lettuce: '/images/crop-lettuce.png',
  pechay: '/images/crop-pechay.png',
  spinach: '/images/crop-spinach.png',
  basil: '/images/crop-spinach.png'
};

export const CROP_SPECIES = {
  lettuce: 'Lactuca sativa',
  pechay: 'Brassica rapa ssp. chinensis',
  spinach: 'Spinacia oleracea',
  basil: 'Ocimum basilicum'
};

export const CROP_EMOJI = {
  lettuce: '🥬',
  pechay: '🥬',
  spinach: '🌿',
  basil: '🌱'
};

// Static Section List Layout (Re-based on thesis details)
export const GREENHOUSE_SECTIONS = [
  { id: 1, name: 'Section 1', cropKey: 'spinach', baseHealth: 98, x: 20, y: 30, area: '25 m²' },
  { id: 2, name: 'Section 2', cropKey: 'lettuce', baseHealth: 78, x: 40, y: 35, area: '28 m²' },
  { id: 3, name: 'Section 3', cropKey: 'spinach', baseHealth: 89, x: 62, y: 35, area: '30 m²' },
  { id: 4, name: 'Section 4', cropKey: 'pechay', baseHealth: 41, x: 73, y: 45, area: '22 m²' },
  { id: 5, name: 'Section 5', cropKey: 'lettuce', baseHealth: 95, x: 35, y: 45, area: '32 m²' },
  { id: 6, name: 'Section 6', cropKey: 'spinach', baseHealth: 91, x: 44, y: 60, area: '24 m²' },
  { id: 7, name: 'Section 7', cropKey: 'pechay', baseHealth: 73, x: 90, y: 60, area: '26 m²' },
  { id: 8, name: 'Section 8', cropKey: 'lettuce', baseHealth: 93, x: 35, y: 25, area: '35 m²' }
];

// Helper to format dates cleanly
export const formatShortDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};
