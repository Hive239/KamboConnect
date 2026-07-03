import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface Crumb {
  label: string;
  to?: string; // omit for the current (last) page
}

/** Shared breadcrumb trail for shareable detail pages. The last crumb renders as the current page. */
export default function PageBreadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          // Separator must be a SIBLING of BreadcrumbItem (both <li>), never nested
          // inside it — an <li> inside an <li> is invalid DOM.
          return (
            <Fragment key={`${c.label}-${i}`}>
              <BreadcrumbItem>
                {isLast || !c.to ? (
                  <BreadcrumbPage className="truncate max-w-[40vw]">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={c.to}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && c.to && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
