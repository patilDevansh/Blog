export const LIST_PUBLISHES_FN =
  import.meta.env.VITE_LIST_PUBLISHES_URL || "/.netlify/functions/list-publishes";

export const GET_MANIFEST_FN =
  import.meta.env.VITE_GET_MANIFEST_URL || "/.netlify/functions/get-manifest";

export const DELETE_PUBLISH_FN =
  import.meta.env.VITE_DELETE_PUBLISH_URL || "/.netlify/functions/delete-publish";

export const PUBLISH_MANIFEST_FN =
  import.meta.env.VITE_PUBLISH_MANIFEST_URL || "/.netlify/functions/publish-manifest";
