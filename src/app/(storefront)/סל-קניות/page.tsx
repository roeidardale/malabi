import { CartPageContent } from "@/components/storefront/CartPageContent";

// This route reads the guest cart cookie, so it must never be statically
// prerendered. Forcing it dynamic also sidesteps a build-time crash where
// Next's static-generation worker throws constructing a URL/Headers object
// from this route's literal (non-ASCII) pathname.
export const dynamic = "force-dynamic";

export default function CartPage() {
  return <CartPageContent />;
}
