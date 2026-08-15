import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { formatGBP, calculateVat, calculateTotal, UK_VAT_RATE } from "@/lib/currency";
import type { Prisma } from "@prisma/client";

export function PricingCard({
  price,
  vatExempt,
}: {
  price: Prisma.Decimal | null;
  vatExempt: boolean;
}) {
  if (price == null) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Pricing</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price (excl. VAT)</span>
          <span>{formatGBP(price)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            VAT {vatExempt ? "" : `(${(UK_VAT_RATE * 100).toFixed(0)}%)`}
          </span>
          {vatExempt ? (
            <Badge variant="outline">Exempt</Badge>
          ) : (
            <span>{formatGBP(calculateVat(price, vatExempt))}</span>
          )}
        </div>
        <div className="flex items-center justify-between border-t pt-2 font-medium">
          <span>Total</span>
          <span>{formatGBP(calculateTotal(price, vatExempt))}</span>
        </div>
      </CardContent>
    </Card>
  );
}
