// Shared by the scraper and the backfill script. Products the live site sells
// as a single item have no size <select>, so they would otherwise have no
// variant and could never be added to the cart.

export const DEFAULT_VARIANT_NAME = "יחידה";
export const DEFAULT_VARIANT_SOURCE_VALUE = "default";
