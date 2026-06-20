import Link from "next/link";

type Variant = "default" | "danger" | "success";

const ICON: Record<Variant, { circleClass: string; content: string }> = {
  default: { circleClass: "", content: "" },
  danger: { circleClass: "sum-icon-danger", content: "" },
  success: { circleClass: "sum-icon-success", content: "✓" },
};

const CARD_VARIANT: Record<Variant, string> = {
  default: "",
  danger: "summary-card-danger",
  success: "summary-card-success",
};

export function SummaryCard({
  value,
  label,
  desc,
  variant = "default",
  href,
  active = false,
}: {
  value: string;
  label: string;
  desc: string;
  variant?: Variant;
  href: string;
  active?: boolean;
}) {
  const icon = ICON[variant];
  const cls = ["summary-card", CARD_VARIANT[variant], active ? "summary-card-active" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={href} className={cls}>
      <div className={`sum-icon-circle${icon.circleClass ? ` ${icon.circleClass}` : ""}`}>
        {icon.content}
      </div>
      <div className="summary-info">
        <span className="val">{value}</span>
        <span className="label">{label}</span>
        <span className="desc">{desc}</span>
      </div>
    </Link>
  );
}
