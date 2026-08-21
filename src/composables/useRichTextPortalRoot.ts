import { shallowRef } from 'vue';

const RICH_TEXT_PORTAL_ROOT_ID = 'neanes-rich-text-portal-root';
const richTextPortalRoot = shallowRef<HTMLElement>();

export function useRichTextPortalRoot() {
  getOrCreateRichTextPortalRoot();
  return richTextPortalRoot;
}

function getOrCreateRichTextPortalRoot() {
  const connectedRoot = richTextPortalRoot.value;

  if (connectedRoot?.isConnected === true) {
    return connectedRoot;
  }

  if (typeof document === 'undefined' || document.body == null) {
    return null;
  }

  const existingRoot = document.getElementById(RICH_TEXT_PORTAL_ROOT_ID);
  const root =
    existingRoot instanceof HTMLElement
      ? existingRoot
      : document.createElement('div');

  root.id = RICH_TEXT_PORTAL_ROOT_ID;
  root.dataset.richTextPortalRoot = '';

  if (!root.isConnected) {
    document.body.appendChild(root);
  }

  richTextPortalRoot.value = root;
  return root;
}
