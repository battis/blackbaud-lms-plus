import { waitForLoad } from '~/utils/dom';

const domQuery = () => document.querySelector('.bb-avatar-image-nav') as HTMLImageElement;

function replace(container: HTMLElement, imageURL: string) {
  const images = container.querySelectorAll<HTMLImageElement>('img[class^="bb-avatar-image"]:not(#mygannplusicon)');
  for (const image of images) {
    image.src = imageURL;
  }
}

export default async function setAllImages(imageURL: string) {
  const obs = new MutationObserver(async mutationList => {
    for (let mutation of mutationList) {
      for (let newNode of mutation.addedNodes) {
        if (newNode instanceof HTMLElement) {
          replace(newNode, imageURL);
        }
      }
    }
  });
  replace(document.body, imageURL);
  obs.observe(document.body, { childList: true, subtree: true });

  const header = await waitForLoad(domQuery);
  const srcWatcher = new MutationObserver(() => {
    if (header.src !== imageURL) {
      header.src = imageURL;
    }
  });
  srcWatcher.observe(header, { attributes: true, attributeFilter: ['src'] });
}
