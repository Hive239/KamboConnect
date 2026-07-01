import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Plus, Package } from "@/lib/icons";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/entities";

export default function ProductCard({ product, onAdd, onOpen }: { product: Product; onAdd: () => void; onOpen: () => void }) {
  const soldOut = product.status === "sold_out" || product.stock === 0;
  return (
    <motion.div whileHover={{ y: -4 }} className="group">
      <Card className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-lg">
        <button onClick={onOpen} className="block w-full text-left" aria-label={product.title}>
          <div className="relative aspect-square w-full bg-muted">
            {product.image_urls?.[0] ? (
              <img loading="lazy" src={product.image_urls[0]} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/40" weight="duotone" /></div>
            )}
            {product.category && <Badge variant="tier" className="absolute left-3 top-3">{product.category}</Badge>}
            {soldOut && <div className="absolute inset-0 flex items-center justify-center bg-background/60"><Badge variant="secondary">Sold out</Badge></div>}
          </div>
        </button>
        <div className="p-4">
          <h3 className="truncate font-semibold">{product.title}</h3>
          <p className="truncate text-xs text-muted-foreground">by {product.seller_name}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-primary">{formatCurrency(product.price, product.currency)}</span>
            {typeof product.rating === "number" && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{product.rating}</span>
            )}
          </div>
          <Button size="sm" className="mt-3 w-full gap-2" disabled={soldOut} onClick={onAdd}>
            <Plus className="h-4 w-4" weight="bold" /> Add to cart
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
