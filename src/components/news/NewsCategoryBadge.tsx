import { CATEGORY_LABEL, type NewsCategory } from "@/lib/news/format";

const NewsCategoryBadge = ({ category }: { category: NewsCategory }) => (
  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
    {CATEGORY_LABEL[category]}
  </span>
);

export default NewsCategoryBadge;
