import './style.css';

const query = new URLSearchParams(location.search);

if (query.get('demo') === '1') location.replace('/demo/');
if (query.has('license')) history.replaceState({}, '', `${location.pathname}${location.hash}`);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
