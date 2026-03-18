// Client-side channel map — reads from the shared data/channels.json
// Vite resolves this via the @data alias in vite.config.js
//
// If the alias doesn't resolve in your setup, just paste channels.json
// content directly here as a JS object.

import channelData from '../../../data/channels.json';

export const NETWORKS = channelData.networks;

export function getNetwork(key) {
  return NETWORKS[key] || {
    label: key || 'TBD',
    youtubeTV: { channelNumber: '?', url: 'https://tv.youtube.com' },
  };
}

// Color classes per network for badges
export const NETWORK_COLORS = {
  ESPN:   { bg: '#FAECE7', text: '#712B13' },
  ESPN2:  { bg: '#FAECE7', text: '#712B13' },
  ESPNU:  { bg: '#FAECE7', text: '#712B13' },
  CBS:    { bg: '#E6F1FB', text: '#0C447C' },
  TBS:    { bg: '#EEEDFE', text: '#3C3489' },
  TNT:    { bg: '#FAEEDA', text: '#633806' },
  truTV:  { bg: '#E1F5EE', text: '#085041' },
  FS1:    { bg: '#FAECE7', text: '#712B13' },
  FS2:    { bg: '#FAECE7', text: '#712B13' },
};

export function getNetworkColor(key) {
  return NETWORK_COLORS[key] || { bg: '#F1EFE8', text: '#444441' };
}
