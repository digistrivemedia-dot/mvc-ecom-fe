"use client";

import Link from "next/link";
import { toast } from "sonner";
import { HiTrendingUp, HiShoppingCart } from "react-icons/hi";
import { ProductItem } from "@/components/products/ProductItem";
import { GridProducts } from "@/components/products/GridProducts";
import { useInvestableProducts } from "@/hooks/investment";
import { useInvestorCartStore } from "@/stores/investorCartStore";

// Maps the raw backend product doc (from GET /investor/products) into the
// shape ProductItem expects (see src/app/actions.ts's transformProduct,
// which does the same mapping for the customer storefront — duplicated
// here rather than imported since that file is a "use server" action file
// and its helper isn't exported/importable from client code).
function mapToProductItemShape(p: any) {
  const featured = p.images?.find((img: any) => img.isFeatured) || p.images?.[0];
  return {
    id: p._id,
    name: p.name,
    img: featured?.url,
    price: p.price ?? 0,
    cuttedPrice: p.cuttedPrice,
    category: p.category?.slug || p.category?._id || p.category,
    variants: p.variants || [],
    tags: p.tags,
    shortDescription: p.shortDescription,
  };
}

export default function InvestorProductsPage() {
  const { products, isLoading } = useInvestableProducts();
  const addItem = useInvestorCartStore((s) => s.addItem);
  const cartCount = useInvestorCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const handleAddToCart = (product: any, quantity: number) => {
    const maxQuantity = product.remainingInvestableUnits ?? 0;
    if (maxQuantity <= 0) {
      toast.error(`${product.name} has no units left to invest in right now`);
      return;
    }
    addItem(
      {
        productId: product._id,
        name: product.name,
        img: product.images?.find((img: any) => img.isFeatured)?.url || product.images?.[0]?.url,
        investorPrice: product.investorPrice,
        maxQuantity,
      },
      quantity
    );
    toast.success(`Added ${quantity} unit${quantity > 1 ? "s" : ""} of ${product.name} to your invest cart`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invest in Products</h1>
          <p className="text-slate-600 mt-1">
            Fund a unit of stock and get your payout back when it sells. You never receive the product — this is investment only.
          </p>
        </div>
        <Link
          href="/investor/cart"
          className="relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <HiShoppingCart className="w-5 h-5" />
          Invest Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-xs rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 text-center py-20">
          <HiTrendingUp className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No products open for investment right now</h3>
          <p className="text-slate-600">Check back soon — superadmin opens new products for investment regularly.</p>
        </div>
      ) : (
        <GridProducts>
          {products.map((product: any) => (
            <ProductItem
              key={product._id}
              product={mapToProductItemShape(product)}
              variant="investor"
              investorPrice={product.investorPrice}
              remainingUnits={product.remainingInvestableUnits}
              onAddToInvestCart={(quantity) => handleAddToCart(product, quantity)}
            />
          ))}
        </GridProducts>
      )}
    </div>
  );
}
